"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Booking } from '../../../types/types';
import styles from './BookingInvoice.module.css';
import Image from 'next/image';
import jsPDF from 'jspdf';

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
    day: 'numeric',
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // A4 size: 210mm x 297mm
    });

    // Set font size and style for the document
    doc.setFontSize(10); // Default font size for readability
    doc.setFont('helvetica', 'normal');

    // Starting position (y-coordinate)
    let y = 10;

    // Add logo (try to add only if it’s a supported format like PNG or JPEG)
    if (profile?.logo_url) {
      try {
        // Check if the URL ends with a supported format (PNG or JPEG)
        const isSupportedFormat = profile.logo_url.toLowerCase().endsWith('.png') || 
                                 profile.logo_url.toLowerCase().endsWith('.jpg') || 
                                 profile.logo_url.toLowerCase().endsWith('.jpeg');

        if (isSupportedFormat) {
          doc.addImage(profile.logo_url, 'PNG', 80, y, 50, 30); // Reduced size: 40mm width, 16mm height
          y += 35; // Add space after logo
        } else {
          console.warn('Logo format not supported (SVG detected). Skipping logo in PDF.');
          // Optionally, you can add text or a placeholder instead of the logo
          doc.text('', 10, y);
          y += 10;
        }
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        // Skip the logo and continue with the rest of the PDF
        doc.text('Logo Unavailable', 10, y);
        y += 10;
      }
    }

    // Centered company details
doc.setFontSize(12);
doc.text(profile?.company_name || '', 105, y, { align: 'center' });
y += 5;
doc.setFontSize(10);
doc.setTextColor(100);
doc.text(profile?.address || '', 105, y, { align: 'center' });
y += 5;
doc.text(`Tel: ${profile?.phone_number || ''}`, 105, y, { align: 'center' });
y += 5;
doc.text(`Email: ${profile?.email || ''}`, 105, y, { align: 'center' });
y += 5;
if (profile?.instagram) {
  doc.setTextColor(255, 56, 92);
  doc.text(profile.instagram, 105, y, { align: 'center' });
  y += 5;
}
doc.setTextColor(0);
y += 10;

// Draw a line for section separation
doc.setLineWidth(0.5);
doc.line(10, y, 200, y);
y += 5;

// Guest Information
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('Informacione mbi Musafirin', 10, y);
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
y += 5;
doc.text(`Emri: ${booking.guest_name}`, 10, y);
y += 5;
if (booking.guest_phone) {
  doc.text(`Telefoni: ${booking.guest_phone}`, 10, y);
  y += 5;
}
y += 10;

// Section Divider
doc.setLineWidth(0.3);
doc.line(10, y, 200, y);
y += 5;

// Booking Details with a table-style layout
doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('Detajet e Rezervimit', 10, y);
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
y += 8;

// Light gray background for date box
doc.setFillColor(245, 245, 245);
doc.roundedRect(10, y, 90, 12, 3, 3, 'F');
doc.roundedRect(110, y, 90, 12, 3, 3, 'F');

doc.setFont('helvetica', 'bold');
doc.text('Check-in', 15, y + 5);
doc.text('Check-out', 115, y + 5);

doc.setFont('helvetica', 'normal');
doc.text(`${formatDate(booking.start_date)}`, 15, y + 10);
doc.text(`${formatDate(booking.end_date)}`, 115, y + 10);
y += 20;

// Payment Summary
doc.setLineWidth(0.3);
doc.line(10, y, 200, y);
y += 5;

doc.setFontSize(12);
doc.setFont('helvetica', 'bold');
doc.text('Permbledhje e Pagesave', 10, y);
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
y += 8;

doc.text(`Total:`, 10, y);
doc.text(`€${booking.amount}`, 180, y, { align: 'right' });
y += 5;

doc.text(`Parapagim:`, 10, y);
doc.text(`€${booking.prepayment}`, 180, y, { align: 'right' });
y += 5;

// Remaining balance aligned to the right
doc.text('Për Pagesë:', 10, y);
doc.text(`€${remainingAmount}`, 180, y, { align: 'right' });
y += 5;

// "(ne check-in)" directly under the amount, aligned right
doc.setFontSize(9);
doc.setTextColor(120); // Light gray for secondary text
doc.text('(ne check-in)', 180, y, { align: 'right' });
doc.setTextColor(0); // Reset text color
y += 10; // Extra spacing for the next section

// Footer
doc.setFontSize(8);
doc.setFont('helvetica', 'italic');
doc.text(`Falemnderit qe zgjodhet ${profile?.company_name || ''}!`, 105, 187, { align: 'center' });
doc.text('Me kënaqësi ju mirëpresim', 105, 192, { align: 'center' });
    // Save the PDF
    doc.save(`${booking.guest_name}.pdf`);
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className={styles.printRoot}>
      <button
        onClick={handleDownloadPDF}
        className={styles.printButton}
      >
        Shkarko PDF
      </button>

      <div className={styles.invoice}>
        <div className={styles.header}>
          <div className={styles.logo}>
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt={`${profile.company_name} Logo`}
                width={120} // Default size for display
                height={48}
                priority
                style={{ objectFit: 'contain' }}
              />
            ) : null}
          </div>
          <div className={styles.companyInfo}>
            <p>{profile.company_name}</p>
            <p>{profile.address}</p>
            <p>Tel: {profile.phone_number}</p>
            <p>Email: {profile.email}</p>
            {profile.instagram && (
              <a
                href={`https://instagram.com/${profile.instagram}`}
                className="text-[#FF385C] hover:underline"
              >
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