"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Booking, ParkingSlot } from "@/lib/types";

export default function MyBookingsPage(){
  const router=useRouter();
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [slots,setSlots]=useState<ParkingSlot[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(true);

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/login");return;}
    const [{data:bookingData,error:bErr},{data:slotData,error:sErr}]=await Promise.all([
      supabase.from("bookings").select("id,booking_reference,user_id,slot_id,booking_date,entry_time,exit_time,booking_status").order("booking_date",{ascending:false}),
      supabase.from("parking_slots").select("id,location_name,slot_number,current_status")
    ]);
    if(bErr||sErr)setMessage(bErr?.message||sErr?.message||"Unable to load bookings.");
    setBookings((bookingData??[]) as Booking[]);setSlots((slotData??[]) as ParkingSlot[]);setLoading(false);
  }
  useEffect(()=>{load();},[]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancel(reference:string){
    if(!window.confirm("Cancel this reservation?"))return;
    const {error}=await supabase.rpc("cancel_booking",{p_booking_reference:reference});
    if(error)setMessage(error.message);else{setMessage("Booking cancelled.");await load();}
  }
  return <main className="container"><div className="eyebrow">Your account</div><h1 className="section-title">My Bookings</h1>
    {message&&<div className="notice">{message}</div>}
    {loading?<p>Loading bookings...</p>:bookings.length===0?<section className="card"><p>You have no bookings yet.</p></section>:<div className="grid">
      {bookings.map(b=>{const slot=slots.find(s=>s.id===b.slot_id);return <article className="card" key={b.id}>
        <div className="row"><strong>{b.booking_reference}</strong><span className={`pill ${b.booking_status==="Cancelled"?"red":""}`}>{b.booking_status}</span></div>
        <p className="muted">{slot?.location_name??"Parking location"} · Slot {slot?.slot_number??b.slot_id}</p>
        <p>{b.booking_date} · {b.entry_time.slice(0,5)} – {b.exit_time.slice(0,5)}</p>
        {b.booking_status==="Confirmed"&&<button className="btn danger" onClick={()=>cancel(b.booking_reference)}>Cancel booking</button>}
      </article>;})}
    </div>}
  </main>;
}
