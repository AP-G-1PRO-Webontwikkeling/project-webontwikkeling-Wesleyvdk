import express from "express";
import { Character, User, Weapon } from "./types";
import session from "./session";
import { flashMiddleware } from "./middleware/flashMiddleware";
import { secureMiddleware } from "./middleware/secureMiddleware";
import {
  Connect,
  GetCharacter,
  GetCharacters,
  GetWeapon,
  GetWeapons,
  Seed,
  authenticate,
  editCharacter,
  register,
} from "./database";
import e from "express";
import { error } from "console";
const app = express();

app.set("view engine", "ejs"); // EJS als view engine
app.set("port", 3000);
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session);
app.use(flashMiddleware);

app.get("/", async (req, res) => {
  res.redirect("/characters");
});

app.get("/login", async (req, res) => {
  if (!req.session.user) {
    res.render("login", {error: ""});
  } else {
    res.redirect("/");
  }
});

app.get("/register", async (req, res) => {
  if (!req.session.user) {
    res.render("register",  {error: ""});
  } else {
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.post("/login", async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  try {
    let user: User = await authenticate(name, password);
    delete user.password;
    req.session.user = user;
    req.session.message = { type: "success", message: "Login successful" };
    res.redirect("/");
  } catch (e: any) {
    req.session.message = { type: "error", message: e.message };
    res.render("login", {error: e.message});
  }
});

app.post("/register", async (req, res) => {
  let name = req.body.name;
  let password = req.body.password;
  try {
    let user: User = await register(name, password);
    delete user.password;
    req.session.user = user;
    req.session.message = {
      type: "success",
      message: "Registration successful",
    };
    res.redirect("/");
  } catch (e: any) {
    req.session.message = { type: "error", message: e.message };
    console.log(e.message);
    res.render("register",  {error: e.message})
  }
});

app.get("/characters", async (req, res) => {
  if (req.session.user) {
    let characters = await GetCharacters();

    const query = await req.query.q;
    const sort = (req.query.sort as keyof Character) || '';
    const order = (req.query.order as 'asc' | 'desc') || '';

    if (query && typeof query == "string") {
      characters = characters.filter((character) =>
        character.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    const sortedCharacters = sortCharacters([...characters] as Character[], sort, order);
    const isAdmin = req.session.user.name === "admin";
     res.render("index", { characters: sortedCharacters, sort, order, isAdmin });
    
  } else {
    res.redirect("/login");
  }
});

app.get("/weapons", async (req, res) => {
  if (req.session.user) {
    let weapons = await GetWeapons();
    const sort = (req.query.sort as keyof Weapon) || '';
    const order = (req.query.order as 'asc' | 'desc') || '';

    const query = req.query.q;
    if (query && typeof query == "string") {
      weapons = weapons.filter((weapon) =>
        weapon.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    const sortedWeapons = sortWeapons([...weapons] as Weapon[], sort, order);
    const isAdmin = req.session.user.name === "admin";
     res.render("weapons", { weapons: sortedWeapons, sort, order, isAdmin });
   
  } else {
    res.redirect("/login");
  }
});

app.get("/characters/:id", async (req, res) => {
  if(req.session.user){
  let id = parseInt(req.params.id);
  const character = await GetCharacter(id);
  const isAdmin = req.session.user.name === "admin";
 
    res.render("characterCard", { id: id, data: character, isAdmin});
  }else{
    res.redirect("/login");
  }
  
});
app.get("/weapons/:id", async (req, res) => {
  if(req.session.user) {
  let id = parseInt(req.params.id);
  const weapon = await GetWeapon(id);
  res.render("weaponCard", { id: id, data: weapon });
  }
  else{
    res.redirect("/login");
  }
});

app.get("/characters/:id/edit", async (req, res) => {
  if (req.session.user?.name == "admin") {
    let id = parseInt(req.params.id);
    const character = await GetCharacter(id);
    const weapons = await GetWeapons();
    res.render("editCharacter", {
      id: id,
      character: character,
      weapons: weapons,
    });
  } else {
    res.redirect("/");
  }
});

app.post("/characters/:id/edit", async (req, res) => {
  let id = parseInt(req.params.id);
  let name = req.body.name;
  let description = req.body.description;
  let weapon = parseInt(req.body.weapon);
  // let abilities = req.body.abilities || [];
  // console.log(abilities)
  let isActive = req.body.isActive ?? false;
  await editCharacter(id, name, description, weapon, isActive);
  res.redirect(`/characters`);
});

app.listen(app.get("port"), async () => {
  await Connect();
  Seed();
  console.log("[server] http://localhost:" + app.get("port"));
});


function sortCharacters(characters: Character[], sort: keyof Character, order: 'asc' | 'desc'): Character[] {
  return characters.sort((a, b) => {
    const aValue = a[sort];
    const bValue = b[sort];
    if (aValue !== undefined && bValue !== undefined) {
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      } else if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
    }
    return 0;
  });
}

function sortWeapons(weapons: Weapon[], sort: keyof Weapon, order: 'asc' | 'desc'): Weapon[] {
  return weapons.sort((a, b) => {
    const aValue = a[sort];
    const bValue = b[sort];
    if (aValue !== undefined && bValue !== undefined) {
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      } else if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
    }
    return 0;
  });
}