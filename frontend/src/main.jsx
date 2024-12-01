import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthProvider from './context/AuthContext'; // Import the AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <AuthProvider> {/* Wrap your app with AuthProvider */}
    <App />
  </AuthProvider>
);
