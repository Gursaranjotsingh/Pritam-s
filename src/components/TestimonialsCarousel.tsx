"use client";
import { useEffect, useState } from "react";

// Placeholder quotes — replace with real customer reviews once you have
// them (Admin → Settings can be extended to manage these later).
const TESTIMONIALS = [
  { quote: "Customer reviews will appear here once you start collecting them — replace this placeholder from Admin → Settings.", name: "Verified Customer" },
  { quote: "Add a second review here — real feedback builds trust faster than anything else on a food site.", name: "Verified Customer" },
  { quote: "A third quote rounds out the carousel nicely — swap all three out for genuine testimonials when ready.", name: "Verified Customer" },
];

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  function go(i: number) {
    setIndex((i + TESTIMONIALS.length) % TESTIMONIALS.length);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="w-full flex-shrink-0 px-2">
              <div className="card p-8 text-center">
                <p className="text-base italic text-earth-600">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-earth-700">— {t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          onClick={() => go(index - 1)}
          aria-label="Previous testimonial"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-earth-200 text-earth-500 transition-colors hover:bg-earth-100"
        >
          ‹
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-spice-500" : "w-2 bg-earth-200"}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(index + 1)}
          aria-label="Next testimonial"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-earth-200 text-earth-500 transition-colors hover:bg-earth-100"
        >
          ›
        </button>
      </div>
    </div>
  );
}
