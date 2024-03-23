const express = require("express");
var bodyParser = require("body-parser");
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-adminsdk.json");
const PORT = process.env.PORT || 80;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://it310-pet-store-default-rtdb.firebaseio.com"
});
var database = admin.database();

express()
  .use(express.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .post("/test", async (req, res) => {
    let myVal = await database.ref("/").once("value");
    myVal = myVal.val();
    res.send(myVal);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));