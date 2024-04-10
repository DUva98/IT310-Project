const express = require("express");
var bodyParser = require("body-parser");
var admin = require("firebase-admin");
var serviceAccount = require("./firebase-adminsdk.json");
var path = require('path');
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const PORT = process.env.PORT || 80;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://it310-pet-store-default-rtdb.firebaseio.com",
});
var database = admin.database();

express()
  .use(express.static(path.join(__dirname, 'website')))
  .use(express.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .post("/createItem", async (req, res) => {
    let info = req.body;
    const value = {
      id: uuidv4(),
      name: info.name,
      price: info.price,
      description: info.description,
      petType: info.petType,
      age: info.age,
      imageURL: info.imageURL,
    };

    if (info.petSubtype) {
      value["petSubtype"] = info.petSubtype;
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
      for (key in myVal) {
        res.send(myVal[key]);
      }
    }
  })
  .post("/signIn", async function (req, res) {
    let info = req.body;
    let email = info.email;
    let password = info.password;
    let returnVal;
    let myVal = await database
      .ref("users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");
    myVal = myVal.val();
    if (!myVal) {
      returnVal = {
        error: true,
        data: "Incorrect email address.",
      };
    } else {
      let inputPassword = password;
      let userPassword;
      for (key in myVal) {
        userPassword = myVal[key].password;
      }
      if (bcrypt.compareSync(inputPassword, userPassword)) {
        for (key in myVal) {
          returnVal = {
            error: false,
            data: key,
            firstName: myVal[key].firstName,
            lastName: myVal[key].lastName,
            email: email,
          };
        }
      } else {
        returnVal = {
          error: true,
          data: "Incorrect Password",
        };
      }
    }
    res.send(returnVal);
  })
  .post("/signUp", async function (req, res) {
    let info = req.body;
    let email = info.email;
    let firstName = info.firstName;
    let lastName = info.lastName;
    let password = info.password;
    let passwordConfirm = info.passwordConfirm;
    let returnVal;
    if (!email) {
      returnVal = {
        error: true,
        data: "Please enter an email address.",
      };
      res.send(returnVal);
      return;
    }
    let myVal = await database
      .ref("users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");
    myVal = myVal.val();
    if (myVal) {
      returnVal = {
        error: true,
        data: "Email already exists.",
      };
    } else if (firstName.length == 0 || lastName.length == 0) {
      returnVal = {
        error: true,
        data: "Invalid Name",
      };
    } else if (
      !(
        /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u.test(
          firstName
        ) &&
        /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u.test(
          lastName
        )
      )
    ) {
      returnVal = {
        error: true,
        data: "Invalid Name",
      };
    } else if (
      !/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
        email
      )
    ) {
      returnVal = {
        error: true,
        data: "Invalid email address.",
      };
    } else if (password.length < 6) {
      returnVal = {
        error: true,
        data: "Your password needs to be at least 6 characters.",
      };
    } else if (password != passwordConfirm) {
      returnVal = {
        error: true,
        data: "Your passwords don't match.",
      };
    } else {
      const value = {
        email: email,
        password: hash(password),
        firstName: firstName,
        lastName: lastName,
      };
      database.ref("users").push(value);

      let myVal = await database
        .ref("users")
        .orderByChild("email")
        .equalTo(email)
        .once("value");
      myVal = myVal.val();

      for (key in myVal) {
        returnVal = {
          error: false,
          data: key,
          firstName: firstName,
          lastName: lastName,
          email: email,
        };
      }
    }
    res.send(returnVal);
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

function hash(value) {
  let salt = bcrypt.genSaltSync(10);
  let hashVal = bcrypt.hashSync(value, salt);
  return hashVal;
}
