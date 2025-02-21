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

    // Load Eruda for debugging
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/eruda';
    script.onload = () => {
      // @ts-expect-error
      if (typeof eruda !== 'undefined') eruda.init();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script); // Clean up on unmount
    };
}, []);
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const invoiceElement = document.querySelector(`.${styles.invoice}`);
      if (!invoiceElement) {
        console.error('Invoice element not found');
        return;
      }

      console.log('Invoice HTML:', invoiceElement.outerHTML);

      // Dynamically extract the styles from BookingInvoice.module.css
      // Since CSS Modules are compiled, we need to find the styles in the DOM or use a static import
      // For simplicity, we'll use the DOM approach to find the style tag containing our module styles
      const styleElement = Array.from(document.querySelectorAll('style'))
        .find(style => style.innerHTML.includes('.BookingInvoice-module__')); // Look for module-specific styles
      const moduleCSS = styleElement ? styleElement.innerHTML : '';

      // Fallback: Use a simplified version if DOM extraction fails (optional, remove if not needed)
      const fallbackCSS = `
        .${styles.invoice} { background-color: white; padding: 1.5rem; max-width: 48rem; margin: 0 auto; font-family: Arial, sans-serif; color: #111827; }
        .${styles.header} { border-bottom: 1px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
        .${styles.logo} { display: flex; justify-content: center; margin-bottom: 1rem; }
        .${styles.logo} img { height: 80px; width: auto; }
        .${styles.companyInfo} { font-size: 0.875rem; color: #4b5563; text-align: center; font-family: Arial, sans-serif; }
        .${styles.companyInfo} p { margin: 0.25rem 0; color: #4b5563; font-size: 0.875rem; }
        .${styles.companyInfo} a { color: #FF385C; text-decoration: none; }
        .${styles.companyInfo} a:hover { text-decoration: underline; }
        .${styles.section} { margin-bottom: 1.5rem; }
        .${styles.sectionTitle} { font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 0.75rem; font-family: Arial, sans-serif; }
        .${styles.dateBox} { background-color: #f9fafb; border-radius: 0.5rem; padding: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .${styles.dateBox} p { margin: 0; font-family: Arial, sans-serif; }
        .${styles.dateBox} p:first-child { color: #6b7280; font-size: 0.875rem; }
        .${styles.dateBox} p:last-child { color: #111827; font-weight: 500; }
        .${styles.paymentSection} { border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; }
        .${styles.paymentSection} .space-y-2 { display: flex; flex-direction: column; gap: 0.5rem; }
        .${styles.paymentSection} .flex { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .${styles.paymentSection} span { color: #6b7280; font-family: Arial, sans-serif; font-size: 1rem; }
        .${styles.totalAmount} { font-size: 1.5rem; font-weight: bold; color: #111827; font-family: Arial, sans-serif; }
        .${styles.paymentSection} .text-right { text-align: right; display: block; }
        .${styles.paymentSection} .text-right .block { font-weight: 500; color: #111827; font-size: 1rem; display: block; }
        .${styles.paymentSection} .text-right .text-xs { color: #6b7280; font-size: 0.75rem; display: block; margin-top: 0.25rem; }
        .${styles.footer} { text-align: center; color: #6b7280; font-size: 0.875rem; border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; font-family: Arial, sans-serif; }
        .${styles.footer} p { margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem; }
        .${styles.section} .space-y-1 .flex { display: flex; justify-content: space-between; align-items: center; width: 100%; }
        .${styles.section} .space-y-1 .flex span { font-family: Arial, sans-serif; }
        .${styles.section} .space-y-1 .flex .w-32 { color: #6b7280; font-size: 1rem; }
        .${styles.section} .space-y-1 .flex .font-medium { color: #111827; font-weight: 500; font-size: 1rem; }
        @media print {
          @page { margin: 15mm; size: A4; }
          body { margin: 0; padding: 0; }
          .${styles.invoice} { padding: 1.5rem; max-width: 48rem; margin: 0 auto; box-sizing: border-box; background: white; position: relative; width: 100%; break-inside: avoid; page-break-after: always; }
          .${styles.noPrint} { display: none !important; }
          .${styles.logo} img { height: 60px !important; width: auto !important; }
          .${styles.paymentSection} .flex { display: flex !important; justify-content: space-between !important; align-items: flex-start !important; }
          .${styles.paymentSection} .space-y-2 { display: flex !important; flex-direction: column !important; gap: 0.5rem !important; }
          .${styles.paymentSection} .text-right { display: block !important; text-align: right !important; }
          .${styles.paymentSection} .text-right .block { display: block !important; font-weight: 500 !important; color: #111827 !important; font-size: 1rem !important; }
          .${styles.paymentSection} .text-right .text-xs { display: block !important; color: #6b7280 !important; font-size: 0.75rem !important; margin-top: 0.25rem !important; }
        }
      `;

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice</title>
            <style>
              ${moduleCSS || fallbackCSS}
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

      printWindow.onload = () => {
        console.log('Print window loaded, styles in head:', printWindow.document.head.innerHTML);
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
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