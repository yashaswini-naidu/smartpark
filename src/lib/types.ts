export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
};

export type ParkingSlot = {
  id: number;
  location_name: string;
  slot_number: string;
  current_status: "Available" | "Occupied";
};

export type Booking = {
  id: string;
  booking_reference: string;
  user_id: string;
  slot_id: number;
  booking_date: string;
  entry_time: string;
  exit_time: string;
  booking_status: "Confirmed" | "Cancelled" | "Completed";
};

export function formatTime(value: string) {
  return value?.slice(0, 5) ?? "";
}
