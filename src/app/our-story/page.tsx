import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Our Story" };

export default function OurStoryPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-earth-800 sm:text-4xl">Our Story</h1>
        <p className="mt-6 text-earth-600">
          Pritam&apos;s began with the taste of achaar made at home. For as long as I can remember, my mother has
          made achaar the traditional way — the kind of achaar that fills the kitchen with the smell of mustard
          oil and spices, and the kind that tastes like home.
        </p>
        <p className="mt-4 text-earth-600">
          We started Pritam&apos;s so that this taste — the taste of an Indian household — could reach more
          families, made with the same care as it always has been.
        </p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">Shop Achaar</Link>
      </div>
    </div>
  );
}
