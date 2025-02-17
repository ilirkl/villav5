"use client";

import React from 'react';
import { Booking } from '../types';
import styles from './BookingInvoice.module.css';
import Image from 'next/image';

interface BookingInvoiceProps {
    booking: Booking;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const BookingInvoice = ({ booking }: BookingInvoiceProps) => {
    const remainingAmount = booking.amount - booking.prepayment;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <button
                onClick={handlePrint}
                className={`${styles.printButton} ${styles.noPrint}`}
            >
                Print Invoice
            </button>

            <div className={styles.invoice}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <Image
                            src="/villa-e-gurit.svg"
                            alt="Villa E Gurit Logo"
                            width={200}
                            height={80}
                            priority
                        />
                    </div>
                    <div className={styles.companyInfo}>
                        <p>XK, Rruga e Brezovicës, Shtërpcë 73000</p>
                        <p>Tel: 049 609 996 / 049 115 499</p>
                        <a href="https://instagram.com/villaegurit" className="text-[#FF385C] hover:underline">
                            instagram.com/villaegurit
                        </a>
                    </div>
                </div>

                {/* Guest Information */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Guest Information</h2>
                    <div className="space-y-1">
                        <div className="flex">
                            <span className="w-32 text-gray-600">Guest Name:</span>
                            <span className="font-medium">{booking.guest_name}</span>
                        </div>
                        {booking.guest_phone && (
                            <div className="flex">
                                <span className="w-32 text-gray-600">Phone:</span>
                                <span>{booking.guest_phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Dates */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Booking Details</h2>
                    <div className={styles.dateBox}>
                        <div>
                            <p className="text-gray-600 text-sm">Check-in</p>
                            <p className="font-medium">{formatDate(booking.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Check-out</p>
                            <p className="font-medium">{formatDate(booking.end_date)}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Information */}
                <div className={styles.paymentSection}>
                    <h2 className={styles.sectionTitle}>Payment Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Amount</span>
                            <span className={styles.totalAmount}>€{booking.amount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Prepayment</span>
                            <span>€{booking.prepayment}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span className="text-gray-600">Remaining Balance</span>
                            <div className="text-right">
                                <span className="block font-medium">€{remainingAmount}</span>
                                <span className="text-xs text-gray-500">(Due at check-in)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p>Thank you for choosing Villa e Gurit!</p>
                    <p>We look forward to hosting you.</p>
                </div>
            </div>
        </div>
    );
};

export default BookingInvoice;
