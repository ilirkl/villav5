"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../../utils/supabaseClient"
import Modal from "../Modal"
import BookingForm from "../booking/BookingForm"
import BookingInvoice from "./BookingInvoice"
import { Calendar, ChevronDown, Copy, Edit, Filter, MoreHorizontal, Phone, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"

export interface Booking {
  id: string
  start_date: string
  end_date: string
  checkin_time?: string
  checkout_time?: string
  guest_name: string
  guest_phone: string
  amount: number
  prepayment: number
  notes: string
  user_id?: string
  source: string
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [sourceFilter, setSourceFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "name" | "amount">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("all")
  const limit = 10

  // Convert Date objects to string format for API
  const getDateString = (date?: Date) => {
    return date ? date.toISOString().split("T")[0] : ""
  }

  // Memoize fetchBookings without including offset in dependencies
  const fetchBookings = useCallback(
    async (reset = false) => {
      if (!reset && (!hasMore || isLoading)) {
        return
      }

      setIsLoading(true)
      const currentOffset = reset ? 0 : offset

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        setIsLoading(false)
        return
      }

      const userId = session.user.id

      try {
        let query = supabase
          .from("bookings")
          .select(
            "id, start_date, end_date, checkin_time, checkout_time, guest_name, guest_phone, amount, prepayment, notes, user_id, source",
          )
          .eq("user_id", userId)
          .range(currentOffset, currentOffset + limit - 1)

        if (startDate) query = query.gte("start_date", getDateString(startDate))
        if (endDate) query = query.lte("end_date", getDateString(endDate))
        if (sourceFilter) query = query.eq("source", sourceFilter)

        switch (sortBy) {
          case "date":
            query = query.order("start_date", { ascending: sortOrder === "asc" })
            break
          case "name":
            query = query.order("guest_name", { ascending: sortOrder === "asc" })
            break
          case "amount":
            query = query.order("amount", { ascending: sortOrder === "asc" })
            break
        }

        const { data, error } = await query
        if (error) throw error

        const fetchedBookings = data as Booking[]

        setBookings((prev) => {
          if (reset) {
            return fetchedBookings
          }
          const newBookings = fetchedBookings.filter(
            (newBooking) => !prev.some((existing) => existing.id === newBooking.id),
          )
          return [...prev, ...newBookings]
        })

        setOffset((prev) => (reset ? limit : prev + limit))
        setHasMore(fetchedBookings.length === limit)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        alert("Error loading bookings. Please try again.")
        setBookings([])
      } finally {
        setIsLoading(false)
      }
    },
    [startDate, endDate, sourceFilter, sortBy, sortOrder, offset, hasMore, isLoading],
  )

  // Reset effect when filters change
  useEffect(() => {
    setBookings([])
    setOffset(0)
    setHasMore(true)
    fetchBookings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sourceFilter, sortBy, sortOrder])

  // Initial load
  useEffect(() => {
    fetchBookings(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 &&
        hasMore &&
        !isLoading
      ) {
        fetchBookings()
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, isLoading, fetchBookings])

  const handleBookingSuccess = async (newBooking: Omit<Booking, "id">) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      alert("Please log in to save a booking.")
      return
    }

    const otherBookings =
      modalMode === "edit" && selectedBooking ? bookings.filter((b) => b.id !== selectedBooking.id) : bookings

    const hasOverlap = otherBookings.some((booking) => {
      const existingStart = new Date(booking.start_date)
      const existingEnd = new Date(booking.end_date)
      const newStart = new Date(newBooking.start_date)
      const newEnd = new Date(newBooking.end_date)
      return newStart < existingEnd && newEnd > existingStart
    })

    if (hasOverlap) {
      alert("The selected dates are already booked. Please choose different dates.")
      return
    }

    setIsModalOpen(false)
    setSelectedBooking(null)
    fetchBookings(true)
  }

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedBooking(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleDelete = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", bookingId)
      if (error) throw error
      fetchBookings(true)
    } catch (error) {
      console.error("Error deleting booking:", error)
      alert("Error deleting booking. Please try again.")
    }
  }

  const handleInvoice = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsInvoiceModalOpen(true)
  }

  const handleSort = (newSortBy: "date" | "name" | "amount") => {
    if (sortBy === newSortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc"
      setSortOrder(newOrder)
    } else {
      setSortBy(newSortBy)
      setSortOrder("asc")
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "all") {
      setSourceFilter("")
    } else {
      setSourceFilter(value.charAt(0).toUpperCase() + value.slice(1))
    }
  }

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case "airbnb":
        return "bg-rose-100 text-rose-700"
      case "booking":
        return "bg-blue-100 text-blue-700"
      case "direkt":
        return "bg-emerald-100 text-emerald-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">The Yard Apartment</h1>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto justify-start">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSourceFilter("")}>All Sources</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("Direkt")}>Direkt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("Airbnb")}>Airbnb</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSourceFilter("Booking")}>Booking</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="default" className="bg-rose-500 hover:bg-rose-600" onClick={() => fetchBookings(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-2">
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="airbnb">Airbnb</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="direkt">Direkt</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      <div className="container mx-auto px-4 py-4 flex-grow">
        <div className="space-y-4">
          {bookings.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No bookings found. Add your first booking!</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <Card
                key={booking.id}
                className="overflow-hidden transition-all hover:shadow-md"
                onClick={() => toggleExpand(booking.id)}
              >
                <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-gray-100 text-gray-600">
                      {booking.guest_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{booking.guest_name}</h3>
                      <p className="text-sm text-gray-500">{booking.source.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-rose-500">{formatAmount(booking.amount)}</p>
                    <Badge className={getSourceColor(booking.source)}>{booking.source}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {booking.guest_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${booking.guest_phone}`} className="hover:underline">
                        {booking.guest_phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                    </span>
                  </div>

                  {expandedBookingId === booking.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {booking.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                          <p className="text-sm text-gray-700">{booking.notes}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {booking.checkin_time && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Check-in</h4>
                            <p className="text-sm text-gray-700">{booking.checkin_time}</p>
                          </div>
                        )}

                        {booking.checkout_time && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Check-out</h4>
                            <p className="text-sm text-gray-700">{booking.checkout_time}</p>
                          </div>
                        )}

                        {booking.prepayment > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Prepayment</h4>
                            <p className="text-sm text-gray-700">{formatAmount(booking.prepayment)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-0 border-t">
                  <div className="grid grid-cols-3 w-full">
                    <Button
                      variant="ghost"
                      className="rounded-none h-10 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleInvoice(booking)
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Invoice
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-none h-10 text-gray-600 border-l border-r"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(booking)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-none h-10 text-rose-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(booking.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-gray-500">Loading more bookings...</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleAdd}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-rose-500 hover:bg-rose-600"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t py-2 mt-auto">
        <div className="container mx-auto">
          <div className="flex justify-around items-center">
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-xs">Ballina</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1 text-rose-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <path d="M8 14h.01" />
                <path d="M12 14h.01" />
                <path d="M16 14h.01" />
                <path d="M8 18h.01" />
                <path d="M12 18h.01" />
                <path d="M16 18h.01" />
              </svg>
              <span className="text-xs">Rezervime</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-xs">Shpenzime</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              <span className="text-xs">Financat</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-xs">Konfiguro</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedBooking(null)
        }}
        title={modalMode === "edit" ? "Ndrysho Rezervim" : "Shto Rezervim"}
      >
        <BookingForm
          mode={modalMode}
          booking={selectedBooking || undefined}
          onSuccess={handleBookingSuccess}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedBooking(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false)
          setSelectedBooking(null)
        }}
        title="Booking Invoice"
      >
        {selectedBooking && <BookingInvoice booking={selectedBooking} />}
      </Modal>
    </div>
  )
}

export default BookingsPage

