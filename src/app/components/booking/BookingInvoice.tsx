"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Booking } from '../../../types/types';
import styles from './BookingInvoice.module.css';
import Image from 'next/image';

interface BookingInvoiceProps {
  booking: Booking;
}

interface ProfileData {
  company_name: string;
  phone_number: string;
  email: string;
  address: string;
  instagram: string;
  logo_url?: string;
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const remainingAmount = booking.amount - booking.prepayment;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('company_profile')
        .select('*')
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handlePrint = () => {
    const invoiceElement = document.querySelector(`.${styles.invoice}`);
    if (!invoiceElement) {
      console.error('Invoice element not found');
      return;
    }
  
    const printContents = invoiceElement.outerHTML;
    const originalContents = document.body.innerHTML;
  
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents; // Restore original content
    window.location.reload(); // Optional: Reset state after printing
  };
  if (!profile) return <div>Loading...</div>;

  return (
    <div className={`${styles.printRoot} bg-white`}>
      <button
        onClick={handlePrint}
        className={`${styles.printButton} ${styles.noPrint}`}
      >
        Printo Fakturen
      </button>

      <div className={styles.invoice}>
        <div className={styles.header}>
          <div className={styles.logo}>
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt={`${profile.company_name} Logo`}
                width={200}
                height={80}
                priority
              />
            ) : null}
          </div>
          <div className={styles.companyInfo}>
            <p>{profile.company_name}</p>
            <p>{profile.address}</p>
            <p>Tel: {profile.phone_number}</p>
            <p>Email: {profile.email}</p>
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram}`} className="text-[#FF385C] hover:underline">
                instagram.com/{profile.instagram}
              </a>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Informacione mbi Musafirin</h2>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-32 text-gray-600">Emri:</span>
              <span className="font-medium">{booking.guest_name}</span>
            </div>
            {booking.guest_phone && (
              <div className="flex">
                <span className="w-32 text-gray-600">Telefoni:</span>
                <span>{booking.guest_phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Detajet e Rezervimit</h2>
          <div className={styles.dateBox}>
          <div className="bg-[#f9fafb]">
            <p className="text-gray-600 text-sm bg-[#f9fafb]">Check-in</p>
                <p className="font-medium bg-[#f9fafb]">{formatDate(booking.start_date)}</p>
          </div>
          <div className="bg-[#f9fafb]">
            <p className="text-gray-600 text-sm bg-[#f9fafb]">Check-out</p>
            <p className="font-medium bg-[#f9fafb]">{formatDate(booking.end_date)}</p>
         </div>
          </div>
        </div>

        <div className={styles.paymentSection}>
          <h2 className={styles.sectionTitle}>Permbledhje e Pagesave</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className={styles.totalAmount}>€{booking.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Parapagim</span>
              <span>€{booking.prepayment}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-gray-600">Per Pagese</span>
              <div className="text-right">
                <span className="block font-medium">€{remainingAmount}</span>
                <span className="text-xs text-gray-500">(ne check-in)</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>Falemnderit qe zgjodhet {profile.company_name}!</p>
          <p>Me kënaqësi ju mirëpresim</p>
        </div>
      </div>
    </div>
  );
};

export default BookingInvoice;