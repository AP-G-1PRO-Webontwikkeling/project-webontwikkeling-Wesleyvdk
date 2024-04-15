import express from "express";
const app = express();

interface Card {
  id: number;
  name: string;
  description: "A cunning sorcerer wielding forbidden magics.";
  age: number;
  active_status: boolean;
  dob: string;
  image_url: string;
  weapon_type: string;
  hobbies: string[];
  additional_info: AdditionalInfo;
}
interface AdditionalInfo {
  identifier: string;
  weapon_damage: number;
  magic_power: number;
  defense: number;
  speed: number;
  element: string;
}

app.set("view engine", "ejs"); // EJS als view engine
app.set("port", 3000);
app.use(express.static("public"));

app.get("/", async (req, res) => {
  const response = await fetch(
    "https://raw.githubusercontent.com/Wesleyvdk/images/main/data.json"
  );
  const cards: Card[] = await response.json();

  cards.forEach((card) => {
    console.log(card.name);
  });
  res.render("index", { cards: cards });
});

app.get("/cards/:id", (req, res) => {
  let id = parseInt(req.params.id);
  res.render("cards", { id: id });
});

app.listen(app.get("port"), () =>
  console.log("[server] http://localhost:" + app.get("port"))
);
