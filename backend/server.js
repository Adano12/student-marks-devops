const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = "mysecretkey";

const url = "mongodb://database:27017";
const client = new MongoClient(url);

let db;

// ========================
// CONNECT TO MONGODB
// ========================
async function start() {
  await client.connect();

  db = client.db("schooldb");

  console.log("Connected to MongoDB 🔥");
}

start();

// ========================
// SERVER
// ========================
const server = http.createServer(async (req, res) => {

  // ========================
  // CORS
  // ========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // ========================
  // COLLECTIONS
  // ========================
  const students = db.collection("students");
  const users = db.collection("users");

  // ========================
  // SIGNUP
  // ========================
  if (req.method === "POST" && req.url === "/signup") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {

        const data = JSON.parse(body);

        // CHECK IF USER EXISTS
        const existingUser = await users.findOne({
          username: data.username
        });

        if (existingUser) {
          res.writeHead(400);
          res.end("User already exists");
          return;
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // SAVE USER
        await users.insertOne({
          username: data.username,
          password: hashedPassword
        });

        console.log("User created ✅");

        res.writeHead(201);
        res.end("Signup success");

      } catch (err) {

        console.log("SIGNUP ERROR:", err.message);

        res.writeHead(500);
        res.end("Signup error");
      }
    });

    return;
  }

  // ========================
  // LOGIN
  // ========================
  if (req.method === "POST" && req.url === "/login") {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const data = JSON.parse(body);

        // FIND USER
        const user = await users.findOne({
          username: data.username
        });

        if (!user) {
          res.writeHead(401);
          res.end("Invalid username");
          return;
        }

        // CHECK PASSWORD
        const validPassword = await bcrypt.compare(
          data.password,
          user.password
        );

        if (!validPassword) {
          res.writeHead(401);
          res.end("Invalid password");
          return;
        }

        // CREATE TOKEN
        const token = jwt.sign(
          { username: user.username },
          SECRET,
          { expiresIn: "1h" }
        );

        console.log("Login success 🔥");

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          token: token
        }));

      } catch (err) {

        console.log("LOGIN ERROR:", err.message);

        res.writeHead(500);
        res.end("Login error");
      }
    });

    return;
  }

  // ========================
  // ADD STUDENT
  // ========================
  if (req.method === "POST" && req.url === "/api") {

    console.log("POST request received 🔥");

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const data = JSON.parse(body);

        console.log(
          "Adding student:",
          data.name,
          "| Marks:",
          data.marks,
          "| Grade:",
          data.grade
        );

        await students.insertOne({
          name: data.name,
          subject: data.subject,
          marks: data.marks,
          grade: data.grade
        });

        console.log("Saved to DB ✅");

        res.writeHead(201, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          success: true
        }));

      } catch (err) {

        console.log("POST ERROR:", err.message);

        res.writeHead(500);
        res.end("Error saving");
      }
    });

    return;
  }

  // ========================
  // GET ALL STUDENTS
  // ========================
  if (req.method === "GET" && req.url === "/api") {

    try {

      const allStudents = await students
        .find()
        .sort({ _id: -1 })
        .toArray();

      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify(allStudents));

    } catch (err) {

      console.log("GET ERROR:", err.message);

      res.writeHead(500);
      res.end("Error fetching");
    }

    return;
  }

  // ========================
  // UPDATE STUDENT
  // ========================
  if (req.method === "PUT" && req.url.startsWith("/api/")) {

    console.log("PUT request received 🔥");

    const parts = req.url.split("/");
    const id = parts[2];

    console.log("Updating student ID:", id);

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const data = JSON.parse(body);

        await students.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: data.name,
              subject: data.subject,
              marks: data.marks,
              grade: data.grade
            }
          }
        );

        console.log("Updated successfully ✅");

        res.writeHead(200);
        res.end("Updated");

      } catch (err) {

        console.log("PUT ERROR:", err.message);

        res.writeHead(500);
        res.end("Error updating");
      }
    });

    return;
  }

  // ========================
  // DELETE STUDENT
  // ========================
  if (req.method === "DELETE" && req.url.startsWith("/api/")) {

    console.log("DELETE request received 🔥");

    const parts = req.url.split("/");
    const id = parts[2];

    console.log("Deleting student ID:", id);

    if (!id) {

      res.writeHead(400);
      res.end("Invalid ID");

      return;
    }

    try {

      await students.deleteOne({
        _id: new ObjectId(id)
      });

      console.log("Deleted successfully ✅");

      res.writeHead(200);
      res.end("Deleted");

    } catch (err) {

      console.log("DELETE ERROR:", err.message);

      res.writeHead(500);
      res.end("Error deleting");
    }

    return;
  }

  // ========================
  // NOT FOUND
  // ========================
  res.writeHead(404);
  res.end("Not Found");
});

// ========================
// START SERVER
// ========================
server.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});