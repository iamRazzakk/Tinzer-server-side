const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASSWORD}@cluster0.pkfik7i.mongodb.net/?retryWrites=true&w=majority`;

// Create a new MongoClient
const client = new MongoClient(uri);

// Connect to MongoDB and start the server
async function connectAndStartServer() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("Connected to MongoDB");

    // Start the server after successfully connecting to MongoDB
    app.listen(port, () => {
      console.log(`Tinzer server running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process if there's an error
  }
}

connectAndStartServer();

// Define routes
const usersCollection = client.db("Tinzer").collection("users");
app.post("/users", (req, res) => {
  const userDetail = req.body;

  usersCollection
    .findOne({ email: userDetail.email })
    .then((existingUser) => {
      if (existingUser) {
        // Email already exists, send a response indicating duplication
        res.status(400).json({ error: "Email already exists" });
      } else {
        usersCollection
          .insertOne(userDetail)
          .then((result) => {
            res.status(201).json({ message: "User created successfully" });
          })
          .catch((error) => {
            console.error("Error creating user:", error);
            res.status(500).json({ error: "Internal server error" });
          });
      }
    })
    .catch((error) => {
      console.error("Error checking existing user:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});
