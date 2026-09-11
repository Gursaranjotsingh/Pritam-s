import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-earth-800">Privacy Policy</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm text-earth-600">
          <p>We collect the personal information you provide at checkout (name, phone number, email, and shipping address) solely to process and deliver your order, and to communicate with you about it.</p>
          <p>We do not store your card, UPI PIN, or other sensitive payment credentials — payments are processed securely by our payment gateway partner.</p>
          <p>We do not sell your personal information to third parties.</p>
          <p>For any privacy-related questions or requests, please contact us on WhatsApp or the email listed on our Contact page.</p>
          <p>(This is placeholder policy text — please have it reviewed to ensure it accurately reflects your data practices before launch.)</p>
        </div>
      </div>
    </div>
  );
}
