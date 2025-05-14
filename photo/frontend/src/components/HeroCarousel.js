import React, { useState, useEffect } from "react";

const images = [
  {
    desktop: "/static/images/Carousel/01.jpg",
    tablet: "/static/images/Carousel/01-tablet.jpg",
    mobile: "/static/images/Carousel/01-mobile.jpg",
    alt: "Slide 1"
  },
  {
    desktop: "/static/images/Carousel/02.jpg",
    tablet: "/static/images/Carousel/02-tablet.jpg",
    mobile: "/static/images/Carousel/02-mobile.jpg",
    alt: "Slide 2"
  },
  {
    desktop: "/static/images/Carousel/03.jpg",
    tablet: "/static/images/Carousel/03-tablet.jpg",
    mobile: "/static/images/Carousel/03-mobile.jpg",
    alt: "Slide 3"
  },
  {
    desktop: "/static/images/Carousel/04.png",
    tablet: "/static/images/Carousel/04-tablet.png",
    mobile: "/static/images/Carousel/04-mobile.png",
    alt: "Slide 4"
  },
  {
    desktop: "/static/images/Carousel/05.jpg",
    tablet: "/static/images/Carousel/05-tablet.jpg",
    mobile: "/static/images/Carousel/05-mobile.jpg",
    alt: "Slide 5"
  },
  {
    desktop: "/static/images/Carousel/06.jpg",
    tablet: "/static/images/Carousel/06-tablet.jpg",
    mobile: "/static/images/Carousel/06-mobile.jpg",
    alt: "Slide 6"
  },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  // Auto-slide every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 8000); // 8000ms = 8 seconds
    return () => clearInterval(interval);
  }, []);

  const prev = () => setCurrent((current - 1 + images.length) % images.length);
  const next = () => setCurrent((current + 1) % images.length);

  return (
    <section className="w-full bg-white">
      <div className="relative w-full">
        <picture>
          <source srcSet={images[current].mobile} media="(max-width: 767px)" />
          <source srcSet={images[current].tablet} media="(max-width: 1023px)" />
          <img
            src={images[current].desktop}
            alt={images[current].alt}
            className="w-full object-contain"
            style={{ display: "block" }}
          />
        </picture>
        {/* Carousel controls */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 text-blue-900 rounded-full p-2 shadow hover:bg-white transition"
          aria-label="Previous slide"
        >
          &#8592;
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 text-blue-900 rounded-full p-2 shadow hover:bg-white transition"
          aria-label="Next slide"
        >
          &#8594;
        </button>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full border-2 border-white ${current === idx ? "bg-orange-400" : "bg-white/70"}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroCarousel;