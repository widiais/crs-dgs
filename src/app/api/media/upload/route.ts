import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { database } from '@/lib/db/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const duration = formData.get('duration') as string;

    if (!file || !name || !category || !duration) {
      return NextResponse.json({ 
        error: 'File, name, category, and duration are required' 
      }, { status: 400 });
    }

    // Validate file type - only JPG, PNG, MP4
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'video/mp4'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG images and MP4 videos are allowed' 
      }, { status: 400 });
    }

    // Validate file size based on type
    let maxSize;
    if (file.type.startsWith('image/')) {
      maxSize = 10 * 1024 * 1024; // 10MB for images
    } else if (file.type.startsWith('video/')) {
      maxSize = 100 * 1024 * 1024; // 100MB for videos
    } else {
      maxSize = 10 * 1024 * 1024; // Default 10MB
    }
    
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json({ 
        error: `File size too large. Maximum size is ${maxSizeMB}MB for ${file.type.startsWith('image/') ? 'images' : 'videos'}` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `media/${fileName}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save to database with full MIME type
    const newMedia = await database.createMedia({
      name,
      url: downloadURL,
      type: file.type, // Store full MIME type
      category: category as 'Promotion' | 'Head Office' | 'Store',
      duration: parseInt(duration)
    });

    return NextResponse.json(newMedia, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
} 