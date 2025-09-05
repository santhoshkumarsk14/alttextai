// 2. FIREBASE STORAGE SERVICE
// Create: /src/services/FirebaseStorage.js

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

export class FirebaseStorageService {
  static async uploadFile({ file, path = 'product-images', onProgress }) {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fullPath = `${path}/${fileName}`;
      
      console.log('Starting Firebase upload:', fullPath);
      
      const storageRef = ref(storage, fullPath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Firebase upload progress:', Math.round(progress) + '%');
            
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Firebase upload error:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              console.log('Firebase upload completed:', downloadURL);
              
              resolve({
                file_url: downloadURL,
                file_path: fullPath,
                file_id: fileName,
                size: file.size,
                type: file.type,
                uploaded_at: new Date().toISOString()
              });
            } catch (urlError) {
              reject(new Error(`Failed to get download URL: ${urlError.message}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('Firebase upload setup error:', error);
      throw error;
    }
  }

  static async deleteFile(filePath) {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      console.log('File deleted successfully:', filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  static async getFileURL(filePath) {
    try {
      const fileRef = ref(storage, filePath);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  }
}