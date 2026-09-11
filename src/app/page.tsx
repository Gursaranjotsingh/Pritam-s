import Image from "next/image";
import Link from "next/link";
import { getActiveProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

const promises = [
  { title: "Homemade", desc: "Every jar is prepared at home, the way Indian households have always made achaar." },
  { title: "Traditional Taste", desc: "Recipes passed down and made with the flavours of a real Indian kitchen." },
  { title: "Small Batch", desc: "We make in small batches so every jar gets the attention it deserves." },
  { title: "Made With Care", desc: "From selecting ingredients to packing your order, every step is done with care." },
];

const faqs = [
  { q: "How is Pritam's achaar made?", a: "Our achaar is prepared at home by my mother, using recipes and methods passed down in our family — the same way it's made in Indian households." },
  { q: "How should I store the achaar after opening?", a: "Keep the jar tightly sealed, use a clean dry spoon each time, and store it in a cool, dry place." },
  { q: "How long does delivery take?", a: "Most orders are delivered within 4-6 business days, depending on your location. You'll see the exact estimate at checkout." },
  { q: "Do you take custom or bulk orders?", a: "Yes! Message us on WhatsApp and we'll be happy to help with bulk or custom orders." },
];

export default async function HomePage() {
  const products = await getActiveProducts();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-earth-50 to-cream">
        <div className="container-px flex flex-col items-center gap-8 py-16 text-center sm:py-24">
          <Image src="/logo.png" alt="Pritam's logo" width={120} height={120} className="reveal rounded-full shadow-soft" priority />
          <h1 className="reveal max-w-3xl font-serif text-4xl font-bold leading-tight text-earth-800 sm:text-6xl">
            The Taste of Indian Household
          </h1>
          <p className="reveal max-w-xl text-base text-earth-600 sm:text-lg">
            Homemade Indian achaar, prepared with traditional recipes and the warmth of home.
          </p>
          <div className="reveal flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn-primary">Shop Achaar</Link>
            <Link href="/our-story" className="btn-secondary">Discover Our Story</Link>
          </div>
        </div>
      </section>

      {/* MADE AT HOME */}
      <section className="container-px py-16 text-center sm:py-20">
        <h2 className="font-serif text-2xl font-bold text-earth-700 sm:text-3xl">Made at Home. Made with Love.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-earth-600">
          Every jar of Pritam&apos;s achaar starts in a home kitchen — prepared by my mother using the traditional
          flavours and methods of an Indian household. No factories, no shortcuts, just the taste we grew up with.
        </p>
      </section>

      {/* PRODUCTS */}
      <section className="container-px py-10 sm:py-16">
        <h2 className="mb-8 text-center font-serif text-2xl font-bold text-earth-700 sm:text-3xl">Pick Your Favourite Achaar</h2>
        {products.length === 0 ? (
          <p className="text-center text-earth-500">Our products are being freshly prepared. Please check back soon!</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* OUR PROMISE */}
      <section className="bg-earth-50 py-16 sm:py-20">
        <div className="container-px">
          <h2 className="mb-10 text-center font-serif text-2xl font-bold text-earth-700 sm:text-3xl">Our Promise</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {promises.map((p) => (
              <div key={p.title} className="card p-5 text-center">
                <div className="mb-2 text-2xl text-spice-500">✓</div>
                <h3 className="font-serif text-base font-bold text-earth-700">{p.title}</h3>
                <p className="mt-1 text-sm text-earth-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="container-px py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-bold text-earth-700 sm:text-3xl">From Our Home to Yours</h2>
          <p className="mt-4 text-earth-600">
            Pritam&apos;s began with the taste of achaar made at home. Inspired by my mother&apos;s kitchen and the
            traditional flavours of Indian households, we wanted to share that same warmth with families everywhere.
          </p>
          <Link href="/our-story" className="btn-secondary mt-6">Read Our Full Story</Link>
        </div>
      </section>

      {/* TESTIMONIALS placeholder */}
      <section className="bg-earth-50 py-16 sm:py-20">
        <div className="container-px">
          <h2 className="mb-10 text-center font-serif text-2xl font-bold text-earth-700 sm:text-3xl">What Our Customers Say</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6">
                <p className="text-sm italic text-earth-600">
                  &ldquo;Customer reviews will appear here once you start collecting them — replace this placeholder from Admin → Settings.&rdquo;
                </p>
                <p className="mt-4 text-sm font-semibold text-earth-700">— Verified Customer</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-px py-16 sm:py-20">
        <h2 className="mb-8 text-center font-serif text-2xl font-bold text-earth-700 sm:text-3xl">Frequently Asked Questions</h2>
        <div className="mx-auto max-w-2xl divide-y divide-earth-100">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-earth-700">
                {f.q}
                <span className="ml-2 text-earth-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-earth-500">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-earth-700 py-16 text-center sm:py-20">
        <div className="container-px">
          <h2 className="font-serif text-2xl font-bold text-cream sm:text-3xl">Bring Home the Taste of Pritam&apos;s</h2>
          <Link href="/shop" className="btn-primary mt-6 inline-flex bg-cream text-earth-700 hover:bg-earth-100">
            Shop Achaar
          </Link>
        </div>
      </section>
    </div>
  );
}
