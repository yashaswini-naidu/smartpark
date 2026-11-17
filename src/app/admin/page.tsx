"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Booking, ParkingSlot, Profile } from "@/lib/types";

export default function AdminPage(){
  const router=useRouter();
  const [slots,setSlots]=useState<ParkingSlot[]>([]);
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [location,setLocation]=useState("");
  const [slotNumber,setSlotNumber]=useState("");

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/login");return;}
    const {data:ownProfile,error:ownError}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(ownError||ownProfile?.role!=="admin"){router.replace("/dashboard");return;}

    const [slotResult,bookingResult,profileResult]=await Promise.all([
      supabase.from("parking_slots").select("id,location_name,slot_number,current_status").order("location_name"),
      supabase.from("bookings").select("id,booking_reference,user_id,slot_id,booking_date,entry_time,exit_time,booking_status").order("booking_date",{ascending:false}),
      supabase.from("profiles").select("id,full_name,email,phone,role")
    ]);
    const err=slotResult.error||bookingResult.error||profileResult.error;
    if(err)setMessage(err.message);
    setSlots((slotResult.data??[]) as ParkingSlot[]);
    setBookings((bookingResult.data??[]) as Booking[]);
    setProfiles((profileResult.data??[]) as Profile[]);
    setLoading(false);
  }
  useEffect(()=>{load();},[]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addSlot(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setMessage("");
    const {error}=await supabase.from("parking_slots").insert({location_name:location.trim(),slot_number:slotNumber.trim(),current_status:"Available"});
    if(error){setMessage(error.message);return;}
    setMessage("Parking slot added successfully.");setLocation("");setSlotNumber("");await load();
  }
  async function changeStatus(id:number,status:"Available"|"Occupied"){
    const {error}=await supabase.from("parking_slots").update({current_status:status}).eq("id",id);
    if(error)setMessage(error.message);else await load();
  }
  async function logout(){await supabase.auth.signOut();router.push("/login");}
  const available=slots.filter(s=>s.current_status==="Available").length;
  const occupied=slots.filter(s=>s.current_status==="Occupied").length;
  const reserved=bookings.filter(b=>b.booking_status==="Confirmed").length;

  if(loading)return <main className="container">Loading Admin Dashboard...</main>;
  return <main className="container">
    <div className="row"><div><div className="eyebrow">Management console</div><h1 className="section-title">SmartPark Admin Dashboard</h1><p className="muted">Manage parking spaces and customer reservations.</p></div><button className="btn secondary" onClick={logout}>Logout</button></div>
    {message&&<div className="notice">{message}</div>}
    <div className="grid stats">
      <div className="card"><div className="muted">Total slots</div><div className="stat-value">{slots.length}</div></div>
      <div className="card"><div className="muted">Available</div><div className="stat-value">{available}</div></div>
      <div className="card"><div className="muted">Occupied</div><div className="stat-value">{occupied}</div></div>
      <div className="card"><div className="muted">Confirmed bookings</div><div className="stat-value">{reserved}</div></div>
    </div>
    <section className="card">
      <h2 className="section-title" style={{marginTop:0}}>Add parking slot</h2>
      <form onSubmit={addSlot} className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>
        <div className="field"><label>Location name</label><input required value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Madhapur"/></div>
        <div className="field"><label>Slot number</label><input required value={slotNumber} onChange={e=>setSlotNumber(e.target.value)} placeholder="e.g. A21"/></div>
        <div className="field" style={{alignSelf:"end"}}><button className="btn">Add slot</button></div>
      </form>
    </section>
    <h2 className="section-title">Manage parking slots</h2>
    <section className="card table-wrap"><table><thead><tr><th>Location</th><th>Slot</th><th>Current status</th><th>Update</th></tr></thead><tbody>
      {slots.map(s=><tr key={s.id}><td>{s.location_name}</td><td>{s.slot_number}</td><td>{s.current_status}</td><td><select value={s.current_status} onChange={e=>changeStatus(s.id,e.target.value as "Available"|"Occupied")}><option>Available</option><option>Occupied</option></select></td></tr>)}
    </tbody></table></section>
    <h2 className="section-title">Customer reservations</h2>
    {bookings.length===0?<section className="card muted">No bookings found.</section>:<section className="card table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Email</th><th>Phone</th><th>Location / Slot</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>
      {bookings.map(b=>{const p=profiles.find(x=>x.id===b.user_id);const s=slots.find(x=>x.id===b.slot_id);return <tr key={b.id}><td>{b.booking_reference}</td><td>{p?.full_name??"Not available"}</td><td>{p?.email??"Not available"}</td><td>{p?.phone??"Not available"}</td><td>{s?.location_name??"—"} / {s?.slot_number??b.slot_id}</td><td>{b.booking_date}</td><td>{b.entry_time.slice(0,5)}–{b.exit_time.slice(0,5)}</td><td>{b.booking_status}</td></tr>;})}
    </tbody></table></section>}
    <div className="actions"><button className="btn secondary" onClick={load}>Refresh dashboard</button><button className="btn secondary" onClick={()=>router.push("/dashboard")}>Customer dashboard</button></div>
  </main>;
}
