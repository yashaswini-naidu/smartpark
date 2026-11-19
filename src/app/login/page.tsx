
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // STEP 1: SEND OTP TO EMAIL
  const sendOTP = async () => {
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setEmail(cleanEmail);
      setStep("otp");
      setMessage("A 6-digit verification code has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const verifyOTP = async () => {
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Unable to verify your account.");
      }

      // CHECK USER ROLE
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setMessage("Login successful!");

      if (profile?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const resendOTP = async () => {
    setOtp("");
    await sendOTP();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        background: "#f3f6fa",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          padding: "35px",
          borderRadius: "14px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "30px",
            fontWeight: "bold",
            color: "#16324f",
            marginBottom: "8px",
          }}
        >
          SmartPark
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: "28px",
          }}
        >
          Smart Parking Availability and Reservation System
        </p>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "600",
            marginBottom: "8px",
            color: "#1e293b",
          }}
        >
          {step === "email" ? "Login with Gmail" : "Verify your email"}
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "22px" }}>
          {step === "email"
            ? "Enter your registered email address. We will send you a verification code."
            : `Enter the 6-digit code sent to ${email}.`}
        </p>

        {step === "email" ? (
          <>
            <label
              style={{
                display: "block",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your Gmail address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              style={inputStyle}
            />

            <button
              onClick={sendOTP}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Sending code..." : "Send Authentication Code"}
            </button>
          </>
        ) : (
          <>
            <label
              style={{
                display: "block",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              6-Digit Authentication Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={loading}
              style={{
                ...inputStyle,
                textAlign: "center",
                letterSpacing: "8px",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            />

            <button
              onClick={verifyOTP}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Verifying..." : "Verify and Login"}
            </button>

            <button
              onClick={resendOTP}
              disabled={loading}
              style={secondaryButtonStyle}
            >
              Resend Authentication Code
            </button>

            <button
              onClick={() => {
                setStep("email");
                setOtp("");
                setError("");
                setMessage("");
              }}
              disabled={loading}
              style={textButtonStyle}
            >
              Change Email Address
            </button>
          </>
        )}

        {message && (
          <p style={successStyle}>
            {message}
          </p>
        )}

        {error && (
          <p style={errorStyle}>
            {error}
          </p>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Secure login powered by SmartPark
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  marginBottom: "18px",
  outline: "none",
  fontSize: "15px",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  background: "#16324f",
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  background: "#eaf2f8",
  color: "#16324f",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "500",
};

const textButtonStyle: React.CSSProperties = {
  display: "block",
  margin: "15px auto 0",
  background: "transparent",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
};

const successStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "12px",
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "8px",
  fontSize: "14px",
};

const errorStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "12px",
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontSize: "14px",
};
