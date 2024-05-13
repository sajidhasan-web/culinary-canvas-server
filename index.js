const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 9000;



const corsOptions ={
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
      ],
      credentials: true,
      optionSuccessStatus: 200,
}


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
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const foodsCollection = client.db('CulinaryCanvasDB').collection('foods')
    const purchasesCollection = client.db('CulinaryCanvasDB').collection('purchases')


    app.get('/foods', async(req, res) => {
        const result = await foodsCollection.find().toArray();
        res.send(result);
    })

    app.get("/food/:id", async(req, res) => {
        const id = req.params.id;
        const result = await foodsCollection.findOne({_id: new ObjectId(id)});
        res.send(result);
    })

    app.get("/search", async(req, res) => {
      const { query } = req.query;
      const result = await foodsCollection.find({ name: { $regex: query, $options: 'i' } }).toArray();
      res.send(result);
  });


      app.post("/purchases", async(req, res)=>{
        const { name, price, quantity, buyerName, buyerEmail, buyingDate } = req.body;

        // Create a purchase object
        const purchase = {
            name,
            price, 
            quantity,
            buyerName,
            buyerEmail,
            buyingDate: new Date(buyingDate) // Convert buyingDate string to Date object
        };

        const result = await purchasesCollection.insertOne(purchase)

        res.send(result);
        
      })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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