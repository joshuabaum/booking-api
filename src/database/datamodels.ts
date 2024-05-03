import { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  id?: number;
  name: string;
  created_at: Date;
}
export interface Restaurant extends RowDataPacket {
  id?: number;
  name: string;
  created_at: Date;
}

export interface Reservation extends RowDataPacket {
  id?: number;
  name: string;
  created_at: Date;
}
