  import React, { useState } from "react";
  import Header from "./components/Header";
  import HeroCarousel from "./components/HeroCarousel";
  import AboutSection from "./components/AboutSection";
  import FeaturesSection from "./components/FeaturesSection";
  import ProgramsSection from "./components/ProgramsSection";
  import SuccessStoriesSection from "./components/SuccessStoriesSection";
  import Footer from "./components/ContactSection";
  import SignupModal from "./components/SignupModal"; // Import the modal

  function App() {
    const [showSignup, setShowSignup] = useState(false);

    return (
      <div className="mt-20">
        <Header style={{ marginTop: "64px" }} onSignUpClick={() => setShowSignup(true)} />
        <HeroCarousel />
        <AboutSection />
        <FeaturesSection />
        <ProgramsSection />
        <SuccessStoriesSection />
        <Footer />
        <SignupModal show={showSignup} onClose={() => setShowSignup(false)} />
      </div>
    );
  }

  export default App;