import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import ProfileModal from './components/profile/ProfileModal';
import { User } from './types';
import { Stethoscope } from 'lucide-react';
import ForgotPassword from './components/auth/ForgotPassword';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  // Check for existing auth on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (token && role) {
      setUser({ token, role });
    }
    
    setIsLoading(false);
  }, []);

  // Debug modal state changes
  useEffect(() => {
    console.log('isProfileModalOpen:', isProfileModalOpen);
  }, [isProfileModalOpen]);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleRegisterSuccess = () => {
    setIsLogin(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleOpenProfile = () => {
    setIsProfileModalOpen(true); // Open the profile modal
    console.log('Opening profile modal'); // Debug log
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false); // Close the profile modal
    console.log('Closing profile modal'); // Debug log
  };

  const handleProfileDeleted = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login'); // Redirect to login after profile deletion
    console.log('Profile deleted, redirecting to login'); // Debug log
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  {/* Form Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-3xl transform rotate-1"></div>
                    <div className="relative">
                      {isLogin ? (
                        <Login 
                          onToggleForm={toggleForm}
                          onLoginSuccess={handleLoginSuccess}
                        />
                      ) : (
                        <Register 
                          onToggleForm={toggleForm}
                          onRegisterSuccess={handleRegisterSuccess}
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© 2025 MedicalApp - Gestion médicale sécurisée</p>
                  </div>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  {/* Form Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-3xl transform rotate-1"></div>
                    <div className="relative">
                      <Login 
                        onToggleForm={toggleForm}
                        onLoginSuccess={handleLoginSuccess}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© 2025 MedicalApp - Gestion médicale sécurisée</p>
                  </div>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  {/* Form Container */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10 rounded-3xl transform rotate-1"></div>
                    <div className="relative">
                      <Register 
                        onToggleForm={toggleForm}
                        onRegisterSuccess={handleRegisterSuccess}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© 2025 MedicalApp - Gestion médicale sécurisée</p>
                  </div>
                </div>
              </div>
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} onOpenProfile={handleOpenProfile} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfile}
          token={user.token}
          onProfileDeleted={handleProfileDeleted}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;