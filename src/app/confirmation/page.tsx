"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent(){
  const params=useSearchParams();
  const ref=params.get("ref");
  return <main className="container"><section className="card form-card text-center">
    <div className="eyebrow">Reservation status</div><h1 className="section-title">Booking confirmed!</h1>
    <div className="notice">Your SmartPark reservation has been submitted successfully.</div>
    <p className="muted">Your booking reference</p><h2 className="text-2xl font-bold">{ref||"See My Bookings"}</h2>
    <div className="actions" style={{justifyContent:"center"}}><Link className="btn" href="/my-bookings">View My Bookings</Link><Link className="btn secondary" href="/dashboard">Dashboard</Link></div>
  </section></main>;
}
export default function ConfirmationPage(){return <Suspense fallback={<main className="container">Loading confirmation...</main>}><ConfirmationContent/></Suspense>;}
