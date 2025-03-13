const express = require('express');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ObjectId } = require('mongodb');

dotenv.config(); // Load environment variables

const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new MongoClient(url);

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

client.connect();
// Connect to MongoDB Atlas
async function connectDB() {
    try {
        const db = client.db(dbName);
        console.log(`✅ Connected to MongoDB Database: ${dbName}`);
    } catch (error) {
        console.error("❌ Database Connection Failed:", error);
        process.exit(1);
    }
}

connectDB();

// Get all passwords
app.get('/', async (req, res) => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const findResult = await collection.find({}).toArray();
        res.json(findResult);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching passwords', error });
    }
});

// Save a password
app.post('/', async (req, res) => {
    try {
        const password = req.body;
        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const result = await collection.insertOne(password);
        res.send({ success: true, result:result });
    } catch (error) {
        res.status(500).json({ message: 'Error saving password', error });
    }
});


// ✅ Update a password
app.put('/:id', async (req, res) => {
    try {
        const db = client.db(dbName);
        const collection = db.collection('passwords');
        const { id } = req.params;
        const newData = req.body; // Updated data from frontend

        const result = await collection.updateOne(
            { _id: new ObjectId(id) },  // Find the existing password by ID
            { $set: newData }           // Update with new data
        );

        res.send({ success: true, result:result });
    } catch (error) {
        res.status(500).json({ message: "Error updating password", error });
    }
});


// Delete a password
app.delete('/', async (req, res) => {
    try {
        const password = req.body;
        const db = client.db(dbName);
        const collection = db.collection('passwords');

        const result = await collection.deleteOne(password); // ✅ ID se delete karo

        res.send({ success: true, result:result});
    } catch (error) {
        res.status(500).json({ message: "Error deleting password", error });
    }
});

// Close connection when the app is shutting down
process.on('SIGINT', async () => {
    console.log("🔄 Closing MongoDB Connection...");
    await client.close();
    process.exit(0);
});

app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});
