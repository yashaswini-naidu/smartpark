
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ParkingSlot } from "@/lib/types";

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function ReservePage() {
  const router = useRouter();

  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [slotId, setSlotId] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [entry, setEntry] = useState("10:00");
  const [exit, setExit] = useState("11:00");
  const [location, setLocation] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState("");

  const locations = useMemo(
    () => Array.from(new Set(slots.map((s) => s.location_name))),
    [slots]
  );

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      if (!user.email) {
        setMessage("Your account does not have an email address.");
        return;
      }

      setCustomerEmail(user.email);
      setCustomerId(user.id);

      const { data, error } = await supabase
        .from("parking_slots")
        .select("id,location_name,slot_number,current_status")
        .eq("current_status", "Available")
        .order("location_name");

      if (error) {
        setMessage(error.message);
      } else {
        const rows = (data ?? []) as ParkingSlot[];
        setSlots(rows);

        if (rows[0]) {
          setLocation(rows[0].location_name);
        }
      }
    }

    load();
  }, [router]);

  const locationSlots = slots.filter(
    (s) => s.location_name === location
  );

  useEffect(() => {
    if (
      locationSlots.length &&
      !locationSlots.some((s) => String(s.id) === slotId)
    ) {
      setSlotId(String(locationSlots[0].id));
    }
  }, [location, slots]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateBooking() {
    if (!slotId) {
      setMessage("Please select an available parking slot.");
      return false;
    }

    if (exit <= entry) {
      setMessage("Exit time must be later than entry time.");
      return false;
    }

    if (date < todayLocal()) {
      setMessage("Please choose today or a future date.");
      return false;
    }

    return true;
  }

  async function sendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!validateBooking()) return;

    setBusy(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      setBusy(false);
      setMessage("Your login session has expired. Please log in again.");
      router.replace("/login");
      return;
    }

    setCustomerEmail(user.email);
    setCustomerId(user.id);

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        shouldCreateUser: false,
      },
    });

    setBusy(false);

    if (error) {
      setMessage("Unable to send verification code: " + error.message);
      return;
    }

    setOtpSent(true);
    setMessage("Verification code sent to " + user.email);
  }

  async function verifyOtpAndBook(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setMessage("Please enter the six-digit verification code.");
      return;
    }

    setBusy(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: customerEmail,
      token: otp,
      type: "email",
    });

    if (error) {
      setBusy(false);
      setMessage("OTP verification failed: " + error.message);
      return;
    }

    if (!data.user || data.user.id !== customerId) {
      setBusy(false);
      setMessage("Account verification failed. Please log in again.");
      router.replace("/login");
      return;
    }

    const { data: bookingData, error: bookingError } =
      await supabase.rpc("create_booking", {
        p_slot_id: Number(slotId),
        p_booking_date: date,
        p_entry_time: entry,
        p_exit_time: exit,
      });

    setBusy(false);

    if (bookingError) {
      setMessage(
        "Email verified, but booking could not be created: " +
          bookingError.message
      );
      return;
    }

    const reference =
      typeof bookingData === "string"
        ? bookingData
        : (bookingData as { booking_reference?: string })
            ?.booking_reference;

    if (reference) {
      router.push(
        `/confirmation?ref=${encodeURIComponent(reference)}`
      );
    } else {
      setMessage(
        "Booking created, but reference was not returned. Check My Bookings."
      );
    }
  }

  return (
    <main className="container">
      <section className="card form-card">
        <div className="eyebrow">Reserve a space</div>

        <h1 className="section-title">
          Parking reservation
        </h1>

        {message && (
          <div className="notice error">{message}</div>
        )}

        {slots.length === 0 ? (
          <p className="muted">
            No slots currently marked Available. Please contact
            the administrator.
          </p>
        ) : !otpSent ? (
          <form onSubmit={sendOtp}>
            <div className="field">
              <label>Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Parking slot</label>
              <select
                required
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
              >
                {locationSlots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Booking date</label>
              <input
                type="date"
                min={todayLocal()}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Entry time</label>
              <input
                type="time"
                required
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Exit time</label>
              <input
                type="time"
                required
                value={exit}
                onChange={(e) => setExit(e.target.value)}
              />
            </div>

            <button className="btn" disabled={busy}>
              {busy
                ? "Sending verification code..."
                : "Proceed to Verification"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtpAndBook}>
            <h2>Verify your email</h2>

            <p className="muted">
              Enter the six-digit code sent to:
              <br />
              <strong>{customerEmail}</strong>
            </p>

            <div className="field">
              <label>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit code"
              />
            </div>

            <button className="btn" disabled={busy}>
              {busy
                ? "Verifying and booking..."
                : "Verify OTP and Confirm Reservation"}
            </button>

            <button
              type="button"
              className="btn"
              style={{ marginTop: "12px" }}
              disabled={busy}
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setMessage("");
              }}
            >
              Go Back
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
