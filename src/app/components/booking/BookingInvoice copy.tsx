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
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceElement = document.querySelector(`.${styles.invoice}`);
      if (!invoiceElement) return;

      // Raw CSS with Tailwind's font-sans family and updated payment section styling
      const invoiceStyles = `
        /* Apply Tailwind's default font-sans globally */
        body, .${styles.invoice}, .${styles.invoice} * {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        }
        .${styles.invoice} {
          background-color: white;
          padding: 1.5rem;
          max-width: 48rem;
          margin: 0 auto;
        }
        .${styles.header} {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .${styles.logo} {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .${styles.logo} img {
          height: 80px;
          width: auto;
        }
        .${styles.companyInfo} {
          font-size: 0.875rem;
          color: #4b5563;
          text-align: center;
        }
        .${styles.section} {
          margin-bottom: 1.5rem;
        }
        .${styles.sectionTitle} {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
        }
        .${styles.dateBox} {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .${styles.paymentSection} div {
            justify-content: space-between !important;
            display: grid;
            grid-template-columns: repeat(2, 2fr);
          }
          .${styles.paymentSection} span.text-gray-600 {
            width: 120px !important;
            text-align: left !important;
            color: #4b5563 !important;
            font-size: 1rem !important;
          }
          .${styles.totalAmount} span:not(.text-gray-600) {
            text-align: right !important;
            font-size: 1.5rem !important;
            font-weight: bold !important;
            color: #111827 !important;
          }
        .${styles.footer} {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1.5rem;
          margin-top: 2rem;
        }
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          html {
            background: white;
            height: 100%;
            width: 100%;
            overflow: visible;
          }
          .${styles.printRoot} * {
            visibility: hidden;
          }
          .${styles.invoice},
          .${styles.invoice} * {
            visibility: visible !important;
          }
          .${styles.invoice} {
            position: static;
            padding: 1.5rem;
            max-width: 48rem;
            margin: 0 auto;
            box-sizing: border-box;
            background: white;
          }
          .${styles.noPrint} {
            display: none !important;
          }
          .${styles.logo} img {
            height: 60px !important;
            width: auto !important;
          }
         .${styles.paymentSection} div {
            justify-content: space-between !important;
            
          }
          .${styles.paymentSection} span.text-gray-600 {
            width: 120px !important;
            text-align: left !important;
            color: #4b5563 !important;
            font-size: 1rem !important;
          }
          .${styles.totalAmount} span:not(.text-gray-600) {
            text-align: right !important;
            font-size: 1.5rem !important;
            font-weight: bold !important;
            color: #111827 !important;
          }
        }
      `;

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <style>
              ${invoiceStyles}
            </style>
          </head>
          <body>
            <div class="${styles.invoice}">
              ${invoiceElement.outerHTML}
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className={styles.printRoot}>
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