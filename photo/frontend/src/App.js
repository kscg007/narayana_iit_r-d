import React, { useState } from "react";
import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import AboutSection from "./components/AboutSection";
import FeaturesSection from "./components/FeaturesSection";
import ProgramsSection from "./components/ProgramsSection";
import SuccessStoriesSection from "./components/SuccessStoriesSection";
import Footer from "./components/ContactSection";
import SignupModal from "./components/SignupModal";
import LoginModal from "./components/LoginModal"; // Import LoginModal

function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // <-- Add this line

  return (
    <div className="mt-20">
      <Header
        style={{ marginTop: "64px" }}
        onSignUpClick={() => setShowSignup(true)}
        onLoginClick={() => setShowLogin(true)} // Pass login handler to Header
      />
      <HeroCarousel />
      <AboutSection />
      <FeaturesSection />
      <ProgramsSection />
      <SuccessStoriesSection />
      <Footer />
      <SignupModal show={showSignup} onClose={() => setShowSignup(false)} />
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} /> {/* Render LoginModal */}
    </div>
  );
}

export default App;