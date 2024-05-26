import { Collection, MongoClient } from "mongodb";
import dotenv from "dotenv";
import { Character, User, Weapon } from "./types";
import bcrypt from "bcrypt";
import session from "./session";
dotenv.config();

const uri = process.env.MONGO_URI ?? "";
const client = new MongoClient(uri);

const collectionUsers: Collection = client.db("webontwikkeling").collection("users");
const collectionCharacters: Collection = client.db("webontwikkeling").collection("characters");
const collectionWeapons: Collection = client.db("webontwikkeling").collection("weapons");

const saltRounds: number = 10;

export async function Exit() {
    try {
        await client.close();
        console.log('Disconnected from database');
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function authenticate(name: string, password: string) {
    if (name === "" || password === "") {
      throw new Error("name and password required");
    }
    let user: User | null = await collectionUsers.findOne<User>({ name: name });
    if (user) {
      if (await bcrypt.compare(password, user.password!)) {
        return user;
      } else {
        throw new Error("Invalid password");
      }
    } else {
      throw new Error("User not found");
    }
  }

export async function register(name: string, password: string) {
    if(name === "" || password === "") {
        throw new Error("name and password required");
    }
    let user: User | null = await collectionUsers.findOne<User>({name: name});
    if(user) {
        throw new Error("User already exists");
    }else{
        let result = await collectionUsers.insertOne({
            name: name,
            password: await bcrypt.hash(password, saltRounds),
          });
          if (!result.acknowledged) {
            throw new Error("Insertion failed");
          }
      
          const insertedUser = await collectionUsers.findOne({
            _id: result.insertedId,
          });
          if (!insertedUser) {
            throw new Error("Failed to retrieve inserted user");
          }
      
          return insertedUser as User;
    }
}

export async function Seed(){
    const characterAmount = await collectionCharacters.countDocuments();
    const userAmount = await collectionUsers.countDocuments();
    const weaponAmount = await collectionWeapons.countDocuments();

    if(characterAmount === 0 ) {
        const response = await fetch(
            "https://raw.githubusercontent.com/Wesleyvdk/images/main/characters.json"
          );
          const characters: Character[] = await response.json();
        await collectionCharacters.insertMany(characters);
    }
    if(userAmount !== 2){
        collectionUsers.deleteMany();
        await addUser("admin", "admin");
        await addUser("user", "user");
    }
    if(weaponAmount === 0) {
        const response = await fetch( "https://raw.githubusercontent.com/Wesleyvdk/images/main/weapons.json")
        const weapons: Weapon[] = await response.json();
        await collectionWeapons.insertMany(weapons)
    }
    
}

export async function addUser(name: string, password: string){
    const user: User = {
        name: name,
        password: await bcrypt.hash(password, saltRounds)
    };
    await collectionUsers.insertOne(user);
}

export async function EditCard(){}

export async function GetCharacters(){
    const characters = await collectionCharacters.find().toArray();
    return characters;
}

// export async function sortedCharacters(sort: string, order: string){
//     if(order == "asc"){
//         const result = await collection.find({}).sort({ name: 1 }).toArray();
//     }else {
//         const result = await collection.find({}).sort({ name: -1 }).toArray();
//     }
    
// }

export async function GetWeapons(){
    const weapons = await collectionWeapons.find().toArray();
    return weapons;
}

export async function GetCharacter(id: number){
    const character: Character | null = await collectionCharacters.findOne<Character>({id: id});
    return character
}
export async function GetWeapon(id: number){
    const weapon: Weapon | null = await collectionWeapons.findOne<Weapon>({id: id});
    return weapon
}

export async function editCharacter(id: number, name: string, description: string, weapon: number, isActive: boolean){
    const weaponObj = await GetWeapon(weapon);
    const updated = await collectionCharacters.updateOne({id: id}, {$set: {name: name, description: description, isActive: isActive, weapon: weaponObj}})
}

export async function Connect() {
    try {
        await client.connect();
        console.log('Connected to database');
        process.on('SIGINT', Exit);
    } catch (error) {
        console.error(error);
    }
}