"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ParkingSlot } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [slots,setSlots] = useState<ParkingSlot[]>([]);
  const [name,setName] = useState("Customer");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id",user.id).maybeSingle();
      if (profile?.full_name) setName(profile.full_name);
      const { data, error } = await supabase.from("parking_slots").select("id,location_name,slot_number,current_status").order("location_name");
      if (error) setError(error.message); else setSlots((data ?? []) as ParkingSlot[]);
      setLoading(false);
    }
    load();
  },[router]);

  async function logout() { await supabase.auth.signOut(); router.push("/login"); }
  const available = slots.filter(s=>s.current_status==="Available").length;
  const occupied = slots.filter(s=>s.current_status==="Occupied").length;

  return <main className="container">
    <div className="row"><div><div className="eyebrow">Customer dashboard</div><h1 className="section-title">Hello, {name} 👋</h1><p className="muted">Find a parking space that works for you.</p></div><button className="btn secondary" onClick={logout}>Logout</button></div>
    {error && <div className="notice error">{error}</div>}
    <div className="grid stats">
      <div className="card"><div className="muted">Total slots</div><div className="stat-value">{loading?"…":slots.length}</div></div>
      <div className="card"><div className="muted">Available</div><div className="stat-value">{loading?"…":available}</div></div>
      <div className="card"><div className="muted">Occupied</div><div className="stat-value">{loading?"…":occupied}</div></div>
      <div className="card"><div className="muted">Locations</div><div className="stat-value">{loading?"…":new Set(slots.map(s=>s.location_name)).size}</div></div>
    </div>
    <div className="actions"><Link className="btn" href="/reserve">Reserve Parking</Link><Link className="btn secondary" href="/my-bookings">My Bookings</Link></div>
    <h2 className="section-title">Parking locations</h2>
    {loading ? <p>Loading parking spaces...</p> : <div className="grid slot-grid">
      {Array.from(new Set(slots.map(s=>s.location_name))).map(location=><article className="card" key={location}>
        <h3 className="font-bold text-lg">{location}</h3>
        <p className="muted">{slots.filter(s=>s.location_name===location && s.current_status==="Available").length} slots currently marked available</p>
        <Link className="btn secondary" href="/reserve">View slots →</Link>
      </article>)}
    </div>}
  </main>;
}
