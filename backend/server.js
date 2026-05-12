const http = require("http");
const { MongoClient, ObjectId } = require("mongodb");

const url = "mongodb://database:27017";
const client = new MongoClient(url);

let db;

// Connect to MongoDB on startup
async function start() {
  await client.connect();
  db = client.db("schooldb");          // ← changed from devopsdb to schooldb
  console.log("Connected to MongoDB 🔥");
}

start();

const server = http.createServer(async (req, res) => {

  // ========================
  // CORS HEADERS
  // ========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const collection = db.collection("students");   // ← changed from "messages" to "students"

  // ========================
  // POST — ADD STUDENT
  // ========================
  if (req.method === "POST" && req.url === "/api") {
    console.log("POST request received 🔥");

    let body = "";

    req.on("data", chunk => { body += chunk; });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        console.log("Adding student:", data.name, "| Marks:", data.marks, "| Grade:", data.grade);

        // Save name, subject, marks, grade to MongoDB
        await collection.insertOne({
          name:    data.name,
          subject: data.subject,
          marks:   data.marks,
          grade:   data.grade
        });

        console.log("Saved to DB ✅");

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.log("POST ERROR:", err.message);
        res.writeHead(500);
        res.end("Error saving");
      }
    });

    return;
  }

  // ========================
  // GET — ALL STUDENTS
  // ========================
  if (req.method === "GET" && req.url === "/api") {
    try {
      // newest first
      const students = await collection.find().sort({ _id: -1 }).toArray();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(students));
    } catch (err) {
      console.log("GET ERROR:", err.message);
      res.writeHead(500);
      res.end("Error fetching");
    }

    return;
  }

  // ========================
  // PUT — UPDATE STUDENT
  // ========================
  if (req.method === "PUT" && req.url.startsWith("/api/")) {
    console.log("PUT request received 🔥");

    const parts = req.url.split("/");
    const id = parts[2];
    console.log("Updating student ID:", id);

    let body = "";

    req.on("data", chunk => { body += chunk; });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: {
              name:    data.name,
              subject: data.subject,
              marks:   data.marks,
              grade:   data.grade
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
  // DELETE — REMOVE STUDENT
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
      await collection.deleteOne({ _id: new ObjectId(id) });

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
  // DEFAULT — NOT FOUND
  // ========================
  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});