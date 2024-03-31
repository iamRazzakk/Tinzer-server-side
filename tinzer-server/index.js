const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
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
const doctorsCollection = client.db("Tinzer").collection("doctor");
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
app.get("/users", async (req, res) => {
  const result = await usersCollection.find().toArray();
  res.send(result);
});

// For user update to doctor
app.post("/doctors/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const result = await doctorsCollection.updateOne(
      { email: email },
      { $set: { role: "doctor" } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "User role updated to doctor" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/doctors", async (req, res) => {
  const result = await doctorsCollection.find().toArray();
  res.send(result);
});

// app.post('/doctors/:email', async(req, res)=>{
//   const
// })

app.patch("/doctors/:email", async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const updateDoc = {
    $set: {
      role: "member",
    },
  };
  const result = await doctorsCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// app.get("/doctors/:email", async (req, res) => {
//   const result = await doctorsCollection.find().toArray();
//   res.send(result);
// });

app.get("/specialities-doctor", async (req, res) => {
  const result = await doctorsCollection.find().toArray();
  res.send(result);
});
//
// Socket.IO event handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  // Example: Handling chat message event
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    // Broadcast the message to all connected clients
    io.emit("chat message", msg);
  });
});
