const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljsyrma.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    console.log("connected to MongoDB!");
    const toyDb = client.db("toyDb").collection("toy");
    // indexing
    const indexKeys = { toyname: 1 };
    const indexOption = { name: "toynameindx" };
    const result = await toyDb.createIndex(indexKeys, indexOption);
    // search by name
    app.get("/toysearch/:name", async (req, res) => {
      const name = req.params.name;
      const result = await toyDb
        .find({ toyname: { $regex: name, $options: "i" } })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      res.send(result);
    });

    // add toys to db
    app.post("/addToy", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      // console.log(body);
      const result = await toyDb.insertOne(body);
      console.log(result);
      res.send(result);
    });
    // get all toys
    app.get("/allToy", async (req, res) => {
      const result = await toyDb
        .find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      res.send(result);
    });
    // get toy through sub-category name
    app.get("/allToy/:toyName", async (req, res) => {
      // console.log(req.params.toyName);
      if (
        req.params.toyName == "lion" ||
        req.params.toyName == "cats" ||
        req.params.toyName == "dianoasur"
      ) {
        // const category = subCategory[0]?.value;
        const result = await toyDb
          .find({ "subCategory.value": req.params.toyName })
          .sort({ createdAt: -1 })
          .toArray();
        // console.log(result);
        return res.send(result);
      }
    });
    // get toy by email id
    app.get("/mytoy/:email", async (req, res) => {
      // console.log(req.params.email);
      const result = await toyDb
        .find({ sellerEmail: req.params.email })
        .toArray();
      res.send(result);
    });
    // update function
    app.get("/toyupdate/:id", async (req, res) => {
      // console.log(req.params.id);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyDb.findOne(query);
      res.send(result);
    });
    // update by put
    app.put("/toyupdate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedToy = req.body;
      const updtdToy = {
        $set: {
          sellerName: updatedToy.sellerName,
          toyname: updatedToy.toyname,
          sellerEmail: updatedToy.sellerEmail,
          Rating: updatedToy.Rating,
          photoURL: updatedToy.photoURL,
          description: updatedToy.description,
          subCategory: updatedToy.subCategory,
          Price: updatedToy.Price,
          Available: updatedToy.Available,
        },
      };
      const result = await toyDb.updateOne(query, updtdToy, option);
      res.send(result);
    });

    // delete function
    app.delete("/toydelete/:id", async (req, res) => {
      // console.log(req.params.id);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyDb.deleteOne(query);
      res.send(result);
    });

    // app.delete("/toy/:id", async (req, res) => {
    //   console.log(req.params.id);
    //   const query = { _id: new ObjectId(id) };
    //   const result = await toyDb.deleteOne(query);
    //   res.send(result);
    // });

    // --------------------------------------------------------------------
    // ends --------------------------------------------------------------------------------
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`this server is running on port ${port}`);
});
