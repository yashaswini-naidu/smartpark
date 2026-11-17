
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ParkingSlot } from "@/lib/types";

type BookingForDisplay = {
  slot_id: number | string;
  entry_time: string;
  exit_time: string;
  booking_status: string;
  parking_status: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<BookingForDisplay[]>([]);
  const [name, setName] = useState("Customer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const localTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    setSelectedDate(localDate);
    setSelectedTime(localTime);
  }, []);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setName(profile.full_name);
      }

      const { data, error: slotError } = await supabase
        .from("parking_slots")
        .select("id,location_name,slot_number,current_status")
        .order("location_name");

      if (slotError) {
        setError(slotError.message);
      } else {
        setSlots((data ?? []) as ParkingSlot[]);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  useEffect(() => {
    async function loadBookings() {
      if (!selectedDate || !selectedTime) return;

      const { data, error: bookingError } = await supabase
        .from("bookings")
        .select(
          "slot_id,entry_time,exit_time,booking_status,parking_status"
        )
        .eq("booking_date", selectedDate)
        .eq("booking_status", "Confirmed");

      if (bookingError) {
        setError(bookingError.message);
        return;
      }

      setBookings((data ?? []) as BookingForDisplay[]);
    }

    loadBookings();
  }, [selectedDate, selectedTime]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getSlotStatus(slot: ParkingSlot) {
    const matchingBooking = bookings.find((booking) => {
      const sameSlot = String(booking.slot_id) === String(slot.id);

      const entry = booking.entry_time.slice(0, 5);
      const exit = booking.exit_time.slice(0, 5);

      const timeMatches =
        entry <= selectedTime && selectedTime < exit;

      return sameSlot && timeMatches;
    });

    if (matchingBooking?.parking_status === "Occupied") {
      return "Occupied";
    }

    if (matchingBooking) {
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

  const occupied = slots.filter(
    (slot) => getSlotStatus(slot) === "Occupied"
  ).length;

  const reserved = slots.filter(
    (slot) => getSlotStatus(slot) === "Reserved"
  ).length;

  const locations = Array.from(
    new Set(slots.map((slot) => slot.location_name))
  );

  return (
    <main className="container">
      <div className="row">
        <div>
          <div className="eyebrow">Customer dashboard</div>
          <h1 className="section-title">Hello, {name} 👋</h1>
          <p className="muted">
            Find a parking space that works for you.
          </p>
        </div>

        <button className="btn secondary" onClick={logout}>
          Logout
        </button>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="card" style={{ marginTop: 20 }}>
        <h2 className="font-bold text-lg">
          Check parking availability
        </h2>

        <div className="grid" style={{ marginTop: 12 }}>
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

      <div className="actions">
        <Link className="btn" href="/reserve">
          Reserve Parking
        </Link>

        <Link className="btn secondary" href="/my-bookings">
          My Bookings
        </Link>
      </div>

      <h2 className="section-title">Parking locations</h2>

      {loading ? (
        <p>Loading parking spaces...</p>
      ) : (
        <>
          {locations.map((location) => {
            const locationSlots = slots.filter(
              (slot) => slot.location_name === location
            );

            return (
              <section
                className="card"
                key={location}
                style={{ marginBottom: 20 }}
              >
                <h3 className="font-bold text-lg">{location}</h3>

                <div className="grid slot-grid">
                  {locationSlots.map((slot) => {
                    const status = getSlotStatus(slot);

                    return (
                      <div
                        className="card"
                        key={slot.id}
                        style={{ marginTop: 12 }}
                      >
                        <h3 className="font-bold">
                          Slot {slot.slot_number}
                        </h3>

                        <p className="muted">
                          Status: <strong>{status}</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Link
                  className="btn secondary"
                  href="/reserve"
                  style={{ marginTop: 16 }}
                >
                  View slots →
                </Link>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
