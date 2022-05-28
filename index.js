const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.x68zz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
    req.decoded = decoded;
    next();
  });
};

async function products() {
  try {
    await client.connect();
    const productCollection = client.db('tools-cart').collection('products');
    const purchaseCollection = client.db('tools-cart').collection('purchase');
    const reviewsCollection = client.db('tools-cart').collection('reviews');
    const userCollection = client.db('tools-cart').collection('users');
    console.log('database connected');

    // get all product from database by this API
    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    })

    app.post('/product', async (req, res) => {
      const newItem = req.body;
      const result = await productCollection.insertOne(newItem);
      res.send(result);
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
    app.get('/purchase', verifyToken, async (req, res) => {
      const email = req.query.userEmail;
      const query = {};
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const cursor = purchaseCollection.find(query);
        const products = await cursor.toArray();
        return res.send(products);
      }
      else return res.status(403).send({ message: 'Forbidden Access' })
    })
    // order filter by email
    app.get('/purchase', async (req, res) => {
      const email = req.query.userEmail;
      console.log(email);
      const query = { userEmail: email }
      const purchase = await purchaseCollection.find(query).toArray();
      res.send(purchase);
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


    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    })

    app.put('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requisterAccount = await userCollection.findOne({ email: requester });
      if (requisterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    })


    // post user data
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });
    })

    // get all users
    app.get('/user', verifyToken, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users)
    })


    //Delete API
    app.delete('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
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