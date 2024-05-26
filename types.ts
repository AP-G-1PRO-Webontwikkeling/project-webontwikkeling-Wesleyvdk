import { ObjectId } from "mongodb";

export interface Character {
  _id?: ObjectId;
  id: number;
  name: string;
  description: string;
  age: number;
  isActive: boolean;
  birthDate: string;
  profileImage: string;
  role: string;
  abilities: string[];
  weapon: Weapon;
}
export interface Weapon {
  _id?: ObjectId;
  id: string;
  name: number;
  type: number;
  damage: number;
  weight: number;
  image: string;
  isMagic: boolean;
}

export interface User{
  _id?: ObjectId;
  name: string;
  password?: string;
}

export interface FlashMessage {
  type: "error" | "success" | "info";
  message: string;
}