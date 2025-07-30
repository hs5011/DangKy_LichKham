// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAw0mfgwDP1WSsgf_dzZR2XpUt0zGWIU4I",
  authDomain: "ql-lichkham.firebaseapp.com",
  projectId: "ql-lichkham",
  storageBucket: "ql-lichkham.firebasestorage.app",
  messagingSenderId: "367560609699",
  appId: "1:367560609699:web:b4fbbb97918ec0ad4b9416",
  measurementId: "G-J10N16S6V0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Thông báo mới';
  const notificationOptions = {
    body: payload.notification?.body || 'Bạn có thông báo mới từ hệ thống',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Mở ứng dụng'
      },
      {
        action: 'close',
        title: 'Đóng'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
}); 