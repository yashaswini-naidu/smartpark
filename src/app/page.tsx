
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Slot = {
  id: number | string;
  current_status: string;
};

type BookingStatus = {
  slot_id: number | string;
  parking_status: string;
};

export default function HomePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<BookingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  // Set today's date and current local time
  useEffect(() => {
    const now = new Date();

    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const time =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    setSelectedDate(date);
    setSelectedTime(time);
  }, []);

  // Load parking slots and their reservation statuses
  useEffect(() => {
    async function loadAvailability() {
      if (!selectedDate || !selectedTime) return;

      setLoading(true);
      setError("");

      const { data: slotData, error: slotError } = await supabase
        .from("parking_slots")
        .select("id,current_status");

      if (slotError) {
        setError(slotError.message);
        setLoading(false);
        return;
      }

      const { data: bookingData, error: bookingError } =
        await supabase.rpc("get_slot_booking_statuses", {
          p_booking_date: selectedDate,
          p_time: selectedTime,
        });

      if (bookingError) {
        setError(bookingError.message);
        setLoading(false);
        return;
      }

      setSlots((slotData ?? []) as Slot[]);
      setBookings((bookingData ?? []) as BookingStatus[]);
      setLoading(false);
    }

    loadAvailability();
  }, [selectedDate, selectedTime]);

  // Calculate each slot's current display status
  function getSlotStatus(slot: Slot) {
    const booking = bookings.find(
      (item) => String(item.slot_id) === String(slot.id)
    );

    if (booking?.parking_status === "Occupied") {
      return "Occupied";
    }

    if (booking?.parking_status === "Reserved") {
      return "Reserved";
    }

    if (slot.current_status === "Occupied") {
      return "Occupied";
    }

    return "Available";
  }

  const available = slots.filter(
    (slot) => getSlotStatus(slot) === "Available"
  ).length;

  const reserved = slots.filter(
    (slot) => getSlotStatus(slot) === "Reserved"
  ).length;

  const occupied = slots.filter(
    (slot) => getSlotStatus(slot) === "Occupied"
  ).length;

  return (
    <main>
      {/* Existing hero section */}
      <section className="hero">
        <div>
          <div className="eyebrow">A smarter way to park</div>

          <h1>
            Find your space.
            <br />
            Save your time.
          </h1>

          <p>
            Discover parking locations, check slot details and reserve
            your parking space before you arrive. Simple, convenient
            and reliable.
          </p>

          <div className="actions">
            <Link className="btn" href="/register">
              Get Started →
            </Link>

            <Link className="btn secondary" href="/login">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hero-art" aria-label="Parking">
          P
        </div>
      </section>

      {/* Live parking availability */}
      <section className="container">
        <div className="eyebrow">Live parking information</div>

        <h2 className="section-title">
          Parking availability
        </h2>

        <p className="muted">
          Check available, reserved and occupied parking spaces.
        </p>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="grid">
            <label>
              <span className="muted">Select date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </label>

            <label>
              <span className="muted">Select time</span>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="notice error" style={{ marginTop: 16 }}>
            Unable to load parking availability: {error}
          </div>
        )}

        <div className="grid stats" style={{ marginTop: 20 }}>
          <div className="card">
            <div className="muted">Total slots</div>
            <div className="stat-value">
              {loading ? "…" : slots.length}
            </div>
          </div>

          <div className="card">
            <div className="muted">Available</div>
            <div className="stat-value">
              {loading ? "…" : available}
            </div>
          </div>

          <div className="card">
            <div className="muted">Reserved</div>
            <div className="stat-value">
              {loading ? "…" : reserved}
            </div>
          </div>

          <div className="card">
            <div className="muted">Occupied</div>
            <div className="stat-value">
              {loading ? "…" : occupied}
            </div>
          </div>
        </div>
      </section>

      {/* Existing how it works section */}
      <section className="container">
        <div className="eyebrow">How it works</div>

        <h2 className="section-title">
          Parking made simple
        </h2>

        <div className="grid slot-grid">
          <article className="card">
            <h3>01 · Find parking</h3>
            <p className="muted">
              Choose a convenient location and browse parking slots.
            </p>
          </article>

          <article className="card">
            <h3>02 · Reserve a slot</h3>
            <p className="muted">
              Select your date and entry and exit times.
            </p>
          </article>

          <article className="card">
            <h3>03 · Park with ease</h3>
            <p className="muted">
              Keep your booking reference and view your reservation.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
