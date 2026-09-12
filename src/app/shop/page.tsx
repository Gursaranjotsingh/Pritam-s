import type { Metadata } from "next";
import { getActiveProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Shop All Achaar",
  description: "Browse Pritam's full range of homemade Indian achaar — Aam, Nimbu, Mirch and Mix achaar.",
};

export const revalidate = 0;

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <div className="container-px py-12 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-bold text-earth-800 sm:text-4xl">All Achaar</h1>
        <p className="mt-2 text-earth-500">Homemade, small-batch, made with love.</p>
      </div>
      {products.length === 0 ? (
        <p className="text-center text-earth-500">No products available right now. Please check back soon!</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
