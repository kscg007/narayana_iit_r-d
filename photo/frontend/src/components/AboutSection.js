import React from "react";

function AboutSection() {
  return (
    <section id="about" className="w-full py-12 bg-[#f7fafc]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-blue-900">
          About Narayana IIT R&D
        </h2>
        <p className="text-lg md:text-xl text-gray-700 mb-6">
          Narayana IIT R&D is dedicated to empowering the next generation of innovators and researchers. Our mission is to provide world-class education, cutting-edge research opportunities, and a vibrant community for students passionate about science and technology.
        </p>
        {/* <img
          src="/static/images/about.jpg"
          alt="About Narayana IIT R&D"
          className="mx-auto rounded-lg shadow-lg w-full max-w-md object-cover"
        /> */}
      </div>
    </section>
  );
}

export default AboutSection;