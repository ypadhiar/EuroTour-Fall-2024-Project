import React from 'react';
import { useNavigate } from 'react-router-dom';

const StartPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="container-fluid min-vh-100 bg-light py-5">
      {/* Header Section */}
      <div className="row justify-content-center mb-5">
        <div className="col-md-8 text-center">
          <h1 className="display-4 mb-4">Travel Destinations Explorer</h1>
          <p className="lead">
            Discover and explore amazing destinations around Europe
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body text-center p-5">
              <h2 className="mb-4">Welcome to Your Travel Journey</h2>
              
              {/* About Section */}
              <div className="mb-5">
                <h3 className="h5 mb-3">What We Offer</h3>
                <ul className="list-unstyled">
                  <li className="mb-2">🔍 Search and explore European destinations</li>
                  <li className="mb-2">📝 Create and manage your travel lists</li>
                  <li className="mb-2">⭐ Rate and review other travelers' lists</li>
                  <li className="mb-2">🌍 Access detailed information about each destination</li>
                  <li className="mb-2">🤝 Share your travel experiences with the community</li>
                </ul>
              </div>

              {/* Features Grid */}
              <div className="row mb-5">
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h4 className="h6">For Everyone</h4>
                    <p className="small mb-0">
                      Search destinations, view public lists, and explore travel information
                    </p>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="p-3 border rounded">
                    <h4 className="h6">For Members</h4>
                    <p className="small mb-0">
                      Create lists, write reviews, and engage with the community
                    </p>
                  </div>
                </div>
              </div>

              {/* Login and Register Buttons */}
              <div className="d-grid gap-2 col-md-6 mx-auto">
                <button 
                  className="btn btn-primary btn-lg mb-3"
                  onClick={handleLogin}
                >
                  Sign In
                </button>
                <a 
                  href="/register" 
                  className="btn btn-outline-primary btn-lg mb-3"
                >
                  Register
                </a>
                <button 
                  className="btn btn-success btn-lg mb-3"
                  onClick={() => navigate('/home')}
                >
                  Visit Site
                </button>
                <p className="text-muted small">
                  Sign in or register to access all features and start creating your travel lists
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <a href="/dmca" className="text-muted small">DMCA Policy</a>
                  <span className="text-muted small">|</span>
                  <a href="/privacy-policy" className="text-muted small">Privacy Policy</a>
                  <span className="text-muted small">|</span>
                  <a href="/aup" className="text-muted small">Acceptable Use Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
