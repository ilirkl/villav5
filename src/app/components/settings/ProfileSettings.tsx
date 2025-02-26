"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import imageCompression from 'browser-image-compression'; // Import the library

interface ProfileData {
  id?: string;
  company_name: string;
  phone_number: string;
  email: string;
  address: string;
  instagram: string;
  logo_url?: string;
}

const ProfileSettings = () => {
  const [profile, setProfile] = useState<ProfileData>({
    company_name: '',
    phone_number: '',
     email: '',
    address: '',
    instagram: ''
   });
   const [logoFile, setLogoFile] = useState<File | null>(null);
   const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
     fetchProfile();
   }, []);

    const fetchProfile = async () => {
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
      .single();

    if (data) {
     setProfile(data);
     }
     if (error && error.code !== 'PGRST116') { // Ignore error if no rows exist
       console.error('Error fetching profile:', error);
     }
   };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const options = {
          maxSizeMB: 0.2,         // (Optional) Max size in MB, adjust as needed (0.2MB = 200KB)
          maxWidthOrHeight: 255,    // (Optional) Max width or height for resizing
          maxHeight: 59,          // (Optional) Max height
          useWebWorker: true,       // (Optional) Use WebWorker for faster compression
          fileType: 'image/webp',  // (Optional) Output WebP format
          quality: 0.9,            // (Optional) Quality level for WebP
        };

        const compressedFile = await imageCompression(file, options);
        console.log('Compressed file size', compressedFile.size / 1024 / 1024, 'MB'); // Log compressed file size

        setLogoFile(compressedFile);

      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Error compressing image. Please try again or use a smaller image.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setLogoFile(null);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setIsLoading(true);

   try {
   let logoUrl = profile.logo_url;

   // Handle logo upload if a new file is selected
   if (logoFile) {
     // Use the original filename but with WebP extension and timestamp for storage
        const storageFileName = `${logoFile.name.split('.')[0]}-${Date.now()}.webp`;

   const { error: uploadError } = await supabase.storage
           .from('logos')
           .upload(storageFileName, logoFile, {
            contentType: 'image/webp' // Explicitly set content type to WebP
          });

         if (uploadError) throw uploadError;

         const { data: publicUrlData } = supabase.storage
           .from('logos')
           .getPublicUrl(storageFileName); // Use the storage file name to get the URL

         logoUrl = publicUrlData.publicUrl;
       }

      const profileData = { ...profile, logo_url: logoUrl };

      const { data, error } = await supabase
       .from('profiles')
       .upsert(profileData)
      .select()
      .single();

      if (error) throw error;

      setProfile(data);
      alert('Profile updated successfully');
     } catch (error) {
       console.error('Error updating profile:', error);
       alert('Error updating profile');
    } finally {
     setIsLoading(false);
     }
  };

  return (
     <div className="bg-white rounded-lg shadow p-6">
       <h2 className="text-xl font-medium text-gray-900 mb-4">Profile Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
           <div>
             <label className="block text-sm font-medium text-gray-700">Company/Villa Name</label>
             <input
              type="text"
               value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
          </div>
           <div>
           <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
               type="tel"
               value={profile.phone_number}
               onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
               className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
               required
            />
          </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
               />
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
              type="text"
              value={profile.address}
               onChange={(e) => setProfile({ ...profile, address: e.target.value })}
               className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
               required
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram</label>
              <input
               type="text"
               value={profile.instagram}
               onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
               className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
             <input
               type="file"
               accept="image/*"
               onChange={handleLogoChange}
               className="mt-1 w-full"
          />
               {profile.logo_url && (
                 <img src={profile.logo_url} alt="Current logo" className="mt-2 h-20 w-auto" />
              )}
            </div>
        </div>
        <button
           type="submit"
           disabled={isLoading}
          className="px-6 py-3 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 disabled:opacity-50"
       >
           {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
  );
};

export default ProfileSettings;