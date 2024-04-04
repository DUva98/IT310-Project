const express = require("express");
var bodyParser = require("body-parser");
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-adminsdk.json");
const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 80;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://it310-pet-store-default-rtdb.firebaseio.com",
});
var database = admin.database();

express()
  .use(express.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .post("/createItem", async (req, res) => {
    let info = req.body;
    const value = {
      id: uuidv4(),
      name: info.name,
      price: info.price,
      description: info.description,
      pet_type: info.pet_type,
      age: info.age,
      imageURL: info.imageURL,
    };

    if (info.pet_subtype) {
      value["pet_subtype"] = info.pet_subtype;
    }

    database.ref("items").push(value);
    res.send(value["id"]);
  })
  .get("/getItems", async (req, res) => {
    let items = [];
    database.ref("items").on("value", (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        items.push(childSnapshot.val());
      });
      res.send(items);
    });
  })
  .get("/getItem/:id", async (req, res) => {
    let id = req.params.id;
    let myVal = await database
      .ref("items")
      .orderByChild("id")
      .equalTo(id)
      .once("value");
    myVal = myVal.val();

    if (!myVal) {
      res.status(404).send("Item Not Found");
    } else {
      res.send(myVal);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
