// useAuthAndFetch.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";
import { Booking } from "../types/calendarTypes";

export const useAuthAndFetch = (fetchBookingsCallback: (data: Booking[]) => void) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      await fetchBookings();
    };

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .order("start_date", { ascending: true });

        if (error) throw new Error(`Supabase error: ${error.message}`);

        if (data) {
          console.log("Fetched bookings:", data);
          fetchBookingsCallback(data);
        }
      } catch (error: unknown) {
        console.error("Error fetching bookings:", error instanceof Error ? error.message : error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, fetchBookingsCallback]);

  return { isLoading };
};