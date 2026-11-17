"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ParkingSlot } from "@/lib/types";

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime()-offset*60000).toISOString().slice(0,10);
}

export default function ReservePage() {
  const router = useRouter();
  const [slots,setSlots] = useState<ParkingSlot[]>([]);
  const [slotId,setSlotId] = useState("");
  const [date,setDate] = useState(todayLocal());
  const [entry,setEntry] = useState("10:00");
  const [exit,setExit] = useState("11:00");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const locations = useMemo(()=>Array.from(new Set(slots.map(s=>s.location_name))),[slots]);
  const [location,setLocation] = useState("");

  useEffect(()=>{
    async function load(){
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.replace("/login");return;}
      const {data,error}=await supabase.from("parking_slots").select("id,location_name,slot_number,current_status").eq("current_status","Available").order("location_name");
      if(error) setMessage(error.message); else { const rows=(data??[]) as ParkingSlot[]; setSlots(rows); if(rows[0]) setLocation(rows[0].location_name); }
    }
    load();
  },[router]);

  const locationSlots=slots.filter(s=>s.location_name===location);
  useEffect(()=>{ if(locationSlots.length && !locationSlots.some(s=>String(s.id)===slotId)) setSlotId(String(locationSlots[0].id)); },[location,slots]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setMessage("");
    if(!slotId){setMessage("Please select an available slot.");return;}
    if(exit<=entry){setMessage("Exit time must be later than entry time.");return;}
    if(date<todayLocal()){setMessage("Please choose today or a future date.");return;}
    setBusy(true);
    const {data,error}=await supabase.rpc("create_booking",{
      p_slot_id:Number(slotId),p_booking_date:date,p_entry_time:entry,p_exit_time:exit
    });
    setBusy(false);
    if(error){setMessage(error.message);return;}
    const reference=typeof data==="string"?data:(data as {booking_reference?:string})?.booking_reference;
    if(reference) router.push(`/confirmation?ref=${encodeURIComponent(reference)}`);
    else setMessage("Booking created, but the reference was not returned. Check My Bookings.");
  }

  return <main className="container"><section className="card form-card">
    <div className="eyebrow">Reserve a space</div><h1 className="section-title">Parking reservation</h1>
    {message&&<div className="notice error">{message}</div>}
    {slots.length===0?<p className="muted">No slots currently marked Available. Please contact the administrator.</p>:<form onSubmit={submit}>
      <div className="field"><label>Location</label><select value={location} onChange={e=>setLocation(e.target.value)}>{locations.map(l=><option key={l}>{l}</option>)}</select></div>
      <div className="field"><label>Parking slot</label><select required value={slotId} onChange={e=>setSlotId(e.target.value)}>{locationSlots.map(s=><option key={s.id} value={s.id}>{s.slot_number}</option>)}</select></div>
      <div className="field"><label>Booking date</label><input type="date" min={todayLocal()} required value={date} onChange={e=>setDate(e.target.value)} /></div>
      <div className="field"><label>Entry time</label><input type="time" required value={entry} onChange={e=>setEntry(e.target.value)} /></div>
      <div className="field"><label>Exit time</label><input type="time" required value={exit} onChange={e=>setExit(e.target.value)} /></div>
      <button className="btn" disabled={busy}>{busy?"Confirming...":"Confirm Reservation"}</button>
    </form>}
  </section></main>;
}
