import React, { useState } from "react";

const testimonials = [
  {
    name: "Ananya Sharma",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "Narayana IIT R&D gave me the confidence and skills to crack JEE Advanced. The faculty and peer group are simply the best!"
  },
  {
    name: "Rahul Verma",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "The research opportunities here are unmatched. I published my first paper as a high schooler thanks to the mentorship I received."
  },
  {
    name: "Priya Singh",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "Olympiad training at Narayana was a game-changer. The personalized attention and resources made all the difference."
  },
  {
    name: "Amit Patel",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "The AI & Data Science program opened doors to internships and projects I never imagined possible in school."
  },
  {
    name: "Sonal Gupta",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "The community and mentorship at Narayana IIT R&D helped me achieve my dreams."
  },
  {
    name: "Vikram Rao",
    image: "/static/images/Testimonials/profile1.jpg",
    quote: "I loved the hands-on research and the friends I made here!"
  }
];

function getVisibleCount() {
  if (window.innerWidth < 640) return 1; // mobile
  if (window.innerWidth < 1024) return 2; // tablet
  return 4; // desktop
}

function SuccessStoriesSection() {
  const [start, setStart] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  // Update visibleCount on resize
  React.useEffect(() => {
    function handleResize() {
      setVisibleCount(getVisibleCount());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate the indices of testimonials to show
  const end = Math.min(start + visibleCount, testimonials.length);
  const visibleTestimonials = testimonials.slice(start, end);

  // Arrow handlers
  const canGoPrev = start > 0;
  const canGoNext = end < testimonials.length;

  const prev = () => {
    if (canGoPrev) setStart(start - 1);
  };
  const next = () => {
    if (canGoNext) setStart(start + 1);
  };

  // For perfect alignment, set fixed heights for image and quote areas
  const IMAGE_HEIGHT = "80px";
  const QUOTE_HEIGHT = "96px"; // Adjust as needed for your longest quote

  return (
    <section id="success" className="w-full py-16 bg-gradient-to-b from-[#f7fafc] to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-10">
          Success Stories
        </h2>
        <div className="relative">
          {/* Cards Row */}
          <div className="flex gap-8 justify-center">
            {visibleTestimonials.map((t, idx) => (
              <div
                key={start + idx}
                className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center min-w-[250px] max-w-xs w-full hover:shadow-2xl transition-all duration-300"
                style={{ minHeight: "340px" }} // Ensures all cards are same height
              >
                {/* Fixed image area */}
                <div
                  className="flex items-center justify-center w-full mb-4"
                  style={{ height: IMAGE_HEIGHT }}
                >
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-100 shadow"
                    style={{ height: IMAGE_HEIGHT, width: IMAGE_HEIGHT }}
                  />
                </div>
                {/* Fixed quote area */}
                <div
                  className="flex items-center justify-center w-full mb-4"
                  style={{ height: QUOTE_HEIGHT }}
                >
                  <p className="text-gray-700 italic">"{t.quote}"</p>
                </div>
                {/* Name always at the same place */}
                <div className="font-semibold text-blue-800 mt-auto">{t.name}</div>
              </div>
            ))}
          </div>
          {/* Arrows */}
          <button
            onClick={prev}
            disabled={!canGoPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 text-blue-900 rounded-full p-2 shadow hover:bg-blue-100 transition ${!canGoPrev ? "opacity-30 cursor-not-allowed" : ""}`}
            aria-label="Previous testimonials"
            style={{ zIndex: 2 }}
          >
            &#8592;
          </button>
          <button
            onClick={next}
            disabled={!canGoNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 text-blue-900 rounded-full p-2 shadow hover:bg-blue-100 transition ${!canGoNext ? "opacity-30 cursor-not-allowed" : ""}`}
            aria-label="Next testimonials"
            style={{ zIndex: 2 }}
          >
            &#8594;
          </button>
        </div>
        {/* Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: testimonials.length - visibleCount + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setStart(idx)}
              className={`w-3 h-3 rounded-full border-2 border-blue-200 ${start === idx ? "bg-orange-400" : "bg-white"}`}
              aria-label={`Go to testimonial group ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SuccessStoriesSection;