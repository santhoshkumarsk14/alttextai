// 3. FIREBASE FIRESTORE SERVICE (for storing image metadata)
// Create: /src/services/FirebaseFirestore.js

import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy, 
    limit 
  } from 'firebase/firestore';
  import { db } from '@/config/firebase';
  
  export class FirebaseFirestoreService {
    static async createProductImage(data) {
      try {
        const docRef = await addDoc(collection(db, 'product_images'), {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        console.log('Product image saved to Firestore:', docRef.id);
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        throw error;
      }
    }
  
    static async updateProductImage(id, data) {
      try {
        const docRef = doc(db, 'product_images', id);
        await updateDoc(docRef, {
          ...data,
          updated_at: new Date().toISOString()
        });
        
        console.log('Product image updated:', id);
        return true;
      } catch (error) {
        console.error('Error updating Firestore document:', error);
        throw error;
      }
    }
  
    static async getProductImages(projectName = null) {
      try {
        let q;
        if (projectName) {
          q = query(
            collection(db, 'product_images'), 
            where('project_name', '==', projectName),
            orderBy('created_at', 'desc')
          );
        } else {
          q = query(
            collection(db, 'product_images'),
            orderBy('created_at', 'desc'),
            limit(50)
          );
        }
  
        const querySnapshot = await getDocs(q);
        const images = [];
        
        querySnapshot.forEach((doc) => {
          images.push({ id: doc.id, ...doc.data() });
        });
  
        console.log('Retrieved product images:', images.length);
        return images;
      } catch (error) {
        console.error('Error getting product images:', error);
        throw error;
      }
    }
  
    static async deleteProductImage(id) {
      try {
        await deleteDoc(doc(db, 'product_images', id));
        console.log('Product image deleted:', id);
        return true;
      } catch (error) {
        console.error('Error deleting product image:', error);
        throw error;
      }
    }
  }