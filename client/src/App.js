import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import UpdatePassword from './components/UpdatePassword';
import StartPage from './components/StartPage';
import HomePage from './components/HomePage';
import AdminInterface from './components/AdminInterface';
import MyAccount from './components/MyAccount';
import DMCAPolicy from './components/DMCAPolicy';
import PrivacyPolicy from './components/PrivacyPolicy';
import AUP from './components/AUP';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/admin-interface" 
            element={<ProtectedRoute element={<AdminInterface />} requireAdmin={true} />} 
          />
          <Route path="/my-account" 
            element={<ProtectedRoute element={<MyAccount />} />} 
          />
          <Route path="/update-password" 
            element={<ProtectedRoute element={<UpdatePassword />} />} 
          />
          <Route path="/dmca" element={<DMCAPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/aup" element={<AUP />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
