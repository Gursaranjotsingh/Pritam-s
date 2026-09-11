import type { Metadata } from "next";
export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-earth-800 sm:text-4xl">About Pritam&apos;s</h1>
        <p className="mt-6 text-earth-600">
          Pritam&apos;s makes homemade Indian achaar using the kind of recipes and taste associated with a
          traditional Indian household. Every jar is prepared at home by my mother, using methods passed down
          through our family.
        </p>
        <p className="mt-4 text-earth-600">
          We&apos;re a small, home-based startup — not a large factory. We make in small batches, pack each order
          carefully, and try to bring you the same achaar we grew up eating at home.
        </p>
        <p className="mt-4 text-sm text-earth-400">
          (Replace this placeholder copy from Admin → Settings with your own detailed story, photos and any
          verified claims you&apos;d like to add.)
        </p>
      </div>
    </div>
  );
}
