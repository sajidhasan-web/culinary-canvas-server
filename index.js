const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

// middleware
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rsmyn0p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const foodsCollection = client.db("CulinaryCanvasDB").collection("foods");
    const purchasesCollection = client
      .db("CulinaryCanvasDB")
      .collection("purchases");
    const feedbackCollection = client
      .db("CulinaryCanvasDB")
      .collection("feedback");

    app.get("/foods", async (req, res) => {
      const result = await foodsCollection.find().toArray();
      res.send(result);
    });

    app.post("/add-food", async (req, res) => {
     
        const {name, image, price,  quantity,  origin,  description,  userEmail,  userName } = req.body;
        const food = {
          name,
          price,
          image,
          quantity,
          origin,
          description,
          userEmail,
          userName,
        };
        const result = await foodsCollection.insertOne(food);
        res.json(result);
     
    });

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/updateFood/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodsCollection.findOne({ _id: new ObjectId(id) });
      res.json(result);
    })

    app.put("/updateFood/:id", async (req, res) => {
      try {
          const id = req.params.id;
          const filter = {_id: new ObjectId(id)}
          const options = { upsert: true };
          const updatedFood = req.body
          // const { name, image, price, category, quantity, origin, description } = req.body;
          const updatedDoc = {
             $set:{
              name: updatedFood.name,
              price: parseFloat(updatedFood.price),
              image: updatedFood.image,
              category: updatedFood.category,
              quantity: parseInt(updatedFood.quantity),
              origin: updatedFood.origin,
              description: updatedFood.description
             }
          };
          console.log(updatedDoc);
          const result = await foodsCollection.updateOne(filter, updatedDoc, options);
          res.send(result)
          if (result.modifiedCount > 0) {
              res.json({ success: true, message: "Food updated successfully" });
          } else {
              res.status(404).json({ success: false, message: "Food not found" });
          }
      } catch (error) {
          console.error("Error updating food:", error);
          res.status(500).json({ success: false, message: "Internal server error" });
      }
  });
  

    app.get("/my-added-food/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const result = await foodsCollection.find({ userEmail: email }).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while fetching data.");
      }
    });
    

    app.get("/search", async (req, res) => {
      const { query } = req.query;
      const result = await foodsCollection
        .find({ name: { $regex: query, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.post("/purchases", async (req, res) => {
      try {
        const { name, price, quantity, category , buyerName, buyerEmail, buyingDate } =
          req.body;
        const purchase = {
          name,
          price,
          category,
          quantity,
          buyerName,
          buyerEmail,
          buyingDate: new Date(buyingDate),
        };
        const result = await purchasesCollection.insertOne(purchase);
        res.json(result);
      } catch (error) {
        console.error("Error storing purchase:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.patch("/foods/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { quantity } = req.body;
        await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { quantity: -quantity } }
        );
        res.json({ message: "Quantity updated successfully" });
      } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("CulinaryCanvas server is running");
});

app.listen(port, () => {
  console.log(`CulinaryCanvas server is running on port ${port}`);
});
