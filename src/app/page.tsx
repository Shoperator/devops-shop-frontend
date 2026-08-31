import Link from "next/link";
import Catalogue from "@/components/Catalogue";
import { getShopName, getShopTagline } from "@/config/shop";

const FEATURES = [
  {
    icon: "🛍️",
    title: "Browse the catalogue",
    text: "Search the articles the shop owner published and see what is in stock right now.",
  },
  {
    icon: "🧾",
    title: "Track your orders",
    text: "Every order keeps the articles and prices as they were when you bought them.",
  },
  {
    icon: "🔗",
    title: "Pay in crypto",
    text: "Checkout settles in USDT from your own wallet — the shop never touches your keys.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-container">
          <span className="hero-eyebrow">Powered by ShopHub</span>
          <h1 className="hero-title">{getShopName()}</h1>
          <p className="hero-subtitle">{getShopTagline()}</p>
          <div className="hero-actions">
            <Link href="#catalogue" className="btn btn-filled">
              Browse articles
            </Link>
            <Link href="/orders" className="btn btn-outlined">
              My orders
            </Link>
          </div>
        </div>
      </section>

      <div className="page">
        <section className="mb-12">
          <h2 className="section-title">How it works</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card card-interactive">
                <div className="feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <Catalogue />
      </div>
    </>
  );
}
