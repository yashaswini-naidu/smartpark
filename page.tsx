import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <div className="eyebrow">A smarter way to park</div>
          <h1>Find your space.<br />Save your time.</h1>
          <p>Discover parking locations, check slot details and reserve your parking space before you arrive. Simple, convenient and reliable.</p>
          <div className="actions">
            <Link className="btn" href="/register">Get Started →</Link>
            <Link className="btn secondary" href="/login">Sign In</Link>
          </div>
        </div>
        <div className="hero-art" aria-label="Parking">P</div>
      </section>
      <section className="container">
        <div className="eyebrow">How it works</div>
        <h2 className="section-title">Parking made simple</h2>
        <div className="grid slot-grid">
          <article className="card"><h3>01 · Find parking</h3><p className="muted">Choose a convenient location and browse parking slots.</p></article>
          <article className="card"><h3>02 · Reserve a slot</h3><p className="muted">Select your date and entry and exit times.</p></article>
          <article className="card"><h3>03 · Park with ease</h3><p className="muted">Keep your booking reference and view your reservation.</p></article>
        </div>
      </section>
    </main>
  );
}
