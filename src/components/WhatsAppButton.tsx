"use client";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function WhatsAppButton({ phone, message = "Hi Pritam's! I have a question about your achaar." }: { phone: string; message?: string }) {
  return (
    <a
      href={buildWhatsAppLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Pritam's on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-card transition-transform duration-200 hover:scale-110"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white">
        <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.406.71 4.646 1.934 6.527L4 29l7.66-1.902A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.77 9.77 0 0 1-4.98-1.363l-.357-.212-4.546 1.13 1.213-4.43-.233-.372A9.78 9.78 0 0 1 5.727 15c0-5.673 4.604-10.277 10.277-10.277S26.28 9.327 26.28 15 21.677 24.818 16.004 24.818Zm5.65-7.646c-.31-.155-1.83-.903-2.113-1.006-.283-.104-.489-.155-.695.155-.207.31-.797 1.006-.977 1.213-.18.207-.36.233-.67.078-.31-.155-1.31-.483-2.495-1.54-.923-.823-1.546-1.84-1.727-2.15-.18-.31-.02-.478.136-.632.14-.14.31-.362.464-.543.155-.18.207-.31.31-.517.104-.207.052-.388-.026-.543-.078-.155-.695-1.674-.953-2.293-.251-.603-.507-.522-.695-.532-.18-.008-.388-.01-.594-.01-.207 0-.543.078-.827.388-.283.31-1.083 1.058-1.083 2.578s1.109 2.99 1.264 3.196c.155.207 2.183 3.333 5.29 4.674.74.319 1.317.51 1.767.653.742.236 1.417.203 1.95.123.595-.089 1.83-.748 2.088-1.47.258-.723.258-1.343.18-1.47-.077-.129-.283-.207-.593-.362Z" />
      </svg>
    </a>
  );
}
