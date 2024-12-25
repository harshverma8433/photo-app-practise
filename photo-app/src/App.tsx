import React, { useState, useEffect } from 'react';
import { Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import toast, { Toaster } from 'react-hot-toast';
import AuthForm from './components/AuthForm';
import PhotoUpload from './components/PhotoUpload';
import PhotoGallery from './components/PhotoGallery';
import { useNavigate } from 'react-router-dom';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: 'us-east-1:6023eafc-0f92-4e11-8ed4-4882146fdb28',
      userPoolId: 'us-east-1_VybNR0rE4',
      userPoolClientId: '3u4id7jaalrd6q8l5mlh0ig7nv',
      signUpVerificationMethod: 'code',
    }
  },
  Storage: {
    S3: {
      bucket: 'photoappli',
      region: 'us-east-1',


    }
  }
});





function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated'); // Clear authentication state
    localStorage.removeItem('token'); // Remove stored token if any
    toast.success("Logout Success!!!")
    navigate('/login'); // Redirect to login page
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <AuthForm mode="login" setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <AuthForm mode="register" setIsAuthenticated={setIsAuthenticated} />
            }
          />
          <Route
            
            path="/dashboard"
            element={
              isAuthenticated ? (
                <div className="min-h-screen bg-gray-50">
                  <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                        <div className="flex items-center">
                          <h1 className="text-xl font-bold text-gray-800">Photo Share</h1>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              handleSignOut();
                              setIsAuthenticated(false);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </nav>
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <PhotoUpload />
                    <PhotoGallery />
                  </main>
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      
    </>
  );
}

export default App;
