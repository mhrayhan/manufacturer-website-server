const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.x68zz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function products() {
  try {
    await client.connect();
    const productCollection = client.db('tools-cart').collection('products');
    const purchaseCollection = client.db('tools-cart').collection('purchase');
    const reviewsCollection = client.db('tools-cart').collection('reviews');
    console.log('database connected');

    // get all product from database by this API
    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })

    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(req.params);
      const query = { _id: ObjectId(id) };
      const products = await productCollection.findOne(query);
      res.send(products);
    })
    //Order post
    app.post('/purchase', async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result);
    })
    //get order
    app.get('/purchase', async (req, res) => {
      const query = {};
      const cursor = purchaseCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })
    // order filter by email
    app.get('/purchase/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { userEmail: email }
      const user = await purchaseCollection.findOne(query);
      res.send(user);
    })


    //review store in database
    app.post('/review', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    })
    //get review from database
    app.get('/review', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    })

  }
  finally { }
}
products();


app.get('/', (req, res) => {
  res.send('Hello From Tools Cart App')
})

app.listen(port, () => {
  console.log(`Tools Cart app listening on port ${port}`)
})