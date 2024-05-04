import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  id: number;
  name: string;
  diet: Set<string>;
  reservation_ids: Set<number>;
  created_at: Date;
}
export interface Restaurant extends RowDataPacket {
  id: number;
  name: string;
  supported_diet: Set<string>;
  created_at: Date;
}

export interface Reservation extends RowDataPacket {
  id: number;
  restaurant_id: number;
  start_time: Date; // Assume reservation lasts 2 hours.
  num_seats: number;
  user_ids: Set<number>; // If empty assume this is unbooked
  created_at: Date;
}

// TODO: try to use an enum with string mapping
export const dietsMap = new Map<string, number>([
  ["Paleo", 1],
  ["Gluten Free", 2],
  ["Vegetarian", 2],
  ["Vegan", 2],
]);
