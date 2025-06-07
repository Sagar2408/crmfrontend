import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import img1 from "../../assets/img1.jpg";
import img2 from "../../assets/img2.jpg";
import img3 from "../../assets/img3.jpg";

const Signup = ({ userType }) => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const isAdmin = userType === "admin";
  const role = isAdmin ? "Admin" : "Executive"; // default fallback

  const slides = [
    { text: "Fast & Secure", img: img1 },
    { text: "User-Friendly Interface", img: img3 },
    { text: "24/7 Support", img: img2 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Signup only allowed for Admins.");
      navigate("/login");
    }
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    signup(username, email, password, role);
  };

  return (
    <div className="main-container">
      <div className="container">
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar closeButton />

        <div className="left-half">
          <div className="image-wrapper">
            <img src={slides[currentIndex].img} alt="Slide" className="background-img" />
            <div className="slider-overlay">
              <div className="slider-text">{slides[currentIndex].text}</div>
              <div className="indicator-container">
                {slides.map((_, i) => (
                  <div key={i} className={`indicator-line ${i === currentIndex ? "active" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="right-half">
          <div className="login-form">
            <div className="create">Create Admin Account</div>
            <p className="small-text">
              Already have an account? <Link to="/admin/login" style={{ color: "black" }}>Login</Link>
            </p>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input type="hidden" value={role} />
              <button type="submit" disabled={loading}>
                {loading ? "Signing up..." : "SIGN UP"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
