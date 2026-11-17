import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark">P</span>
        <span>Smart<span className="brand-accent">Park</span><small>Park smarter. Save time.</small></span>
      </Link>
      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/my-bookings">My Bookings</Link>
        <Link href="/login">Login</Link>
      </nav>
    </header>
  );
}
