// 1. FIREBASE CONFIGURATION FILE
// Create: /src/config/firebase.js

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB1j3BhST3a1atsmribS73LJBsk6y-ZjzY",
  authDomain: "alttextai-a043e.firebaseapp.com",
  projectId: "alttextai-a043e",
  storageBucket: "alttextai-a043e.firebasestorage.app",
  messagingSenderId: "425763959607",
  appId: "1:425763959607:web:743f0d09125867c0d260b2",
  measurementId: "G-0WL6L16XB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Export Firebase services
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { analytics };

export default app;






// 6. FIREBASE PROJECT SETUP STEPS

/*
FIREBASE SETUP INSTRUCTIONS:

1. Go to https://console.firebase.google.com/
2. Click "Create a project" or "Add project"
3. Enter project name: "alttextai-backend" (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

6. ENABLE FIRESTORE DATABASE:
   - Go to "Firestore Database" in left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select your region
   - Click "Done"

7. ENABLE FIREBASE STORAGE:
   - Go to "Storage" in left sidebar
   - Click "Get started"
   - Choose "Start in test mode"
   - Select same region as Firestore
   - Click "Done"

8. SETUP WEB APP:
   - Go to Project Overview
   - Click "Web" icon (</>)
   - Enter app nickname: "alttextai-web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
   - Copy the firebaseConfig object

9. CONFIGURE SECURITY RULES:

   // Firestore Rules (go to Firestore > Rules):
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /product_images/{document} {
         allow read, write: if true; // Change this for production
       }
       match /store_settings/{document} {
         allow read, write: if true; // Change this for production
       }
     }
   }

   // Storage Rules (go to Storage > Rules):
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /product-images/{allPaths=**} {
         allow read, write: if true; // Change this for production
       }
     }
   }

10. INSTALL FIREBASE SDK:
    npm install firebase

11. UPDATE YOUR FIREBASE CONFIG:
    Replace the firebaseConfig in /src/config/firebase.js with your actual config
*/

// 7. ENVIRONMENT VARIABLES SETUP
// Create: .env.local

/*
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
*/

// Updated firebase.js to use environment variables:
// Note: firebaseConfig is already defined above with environment variables

// 8. TEST FIREBASE CONNECTION
// Create: /src/utils/testFirebase.js



// Add this to your app startup to verify Firebase is working
// In your main App component or index.js:
// testFirebaseConnection();