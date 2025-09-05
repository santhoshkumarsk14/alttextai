import { FirebaseStorageService } from '@/services/FirebaseStorage';
import { FirebaseFirestoreService } from '@/services/FirebaseFirestore';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Firestore write
    const testDoc = await FirebaseFirestoreService.createProductImage({
      filename: 'test-connection.jpg',
      file_url: 'https://example.com/test.jpg',
      project_name: 'connection-test',
      status: 'test'
    });
    
    console.log('✅ Firestore connection successful:', testDoc.id);
    
    // Clean up test document
    await FirebaseFirestoreService.deleteProductImage(testDoc.id);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}