import React from "react";

const programs = [
  {
    image: "/static/images/Programs/JEE.jpeg",
    title: "IIT-JEE Preparation",
    description: "Comprehensive coaching for IIT-JEE with expert faculty, study material, and regular assessments."
  },
  {
    image: "/static/images/Programs/Olympiad.png",
    title: "Olympiad Training",
    description: "Specialized mentoring for national and international Olympiads in Mathematics, Physics, and Chemistry."
  },
  {
    image: "/static/images/Programs/Research.jpg",
    title: "Student Research",
    description: "Opportunities for hands-on research projects and innovation under the guidance of experienced mentors."
  },
  {
    image: "/static/images/Programs/AI.png",
    title: "AI & Data Science",
    description: "Cutting-edge courses and workshops in Artificial Intelligence, Machine Learning, and Data Science."
  }
];

function ProgramsSection() {
  return (
    <section id="programs" className="w-full py-16 bg-gradient-to-b from-white to-[#f7fafc]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-10">
          Our Programs
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {programs.map((program, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
            >
              {/* Image container with fixed height and centered image */}
              <div className="w-full h-80 flex items-center justify-center bg-gray-100">
                <img
                  src={program.image}
                  alt={program.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-2 text-blue-800">{program.title}</h3>
                <p className="text-gray-600 flex-1">{program.description}</p>
                {/* Optional: Add a "Learn More" link or button */}
                {/* <a href="#" className="mt-4 text-orange-500 font-semibold hover:underline">Learn More</a> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProgramsSection;