const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//*middleware
const cors = require('cors');
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(404).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ucy0o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const eventCollection = client.db('volunteerNetwork').collection('event');
        const bookingCollection = client.db('volunteerNetwork').collection('booked');

        //*AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        //*GET all data
        app.get('/events', async (req, res) => {
            const query = {};
            const cursor = eventCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //*GET specific data
        app.get('/event/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await eventCollection.findOne(query);
            res.send(result);
        })

        //*POST single data (for event)
        app.post('/addevent', async (req, res) => {
            const event = req.body;
            const result = await eventCollection.insertOne(event);
            res.send(result);
        })

        //*Post a single data (for booking)
        app.post('/addvolunteer', async (req, res) => {
            const bookingEvent = req.body;
            const result = await bookingCollection.insertOne(bookingEvent);
            res.send(result);
        })

        //*Get specific few data by email query from booking collection
        app.get('/addbookedevents', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            let result;
            if (email === decodedEmail) {
                const query = { email };
                const cursor = bookingCollection.find(query);
                result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'forbidden access' });
            }
        })

        //*DELETE specific data by id query from booking collection
        app.delete('/deleteevent', async (req, res) => {
            const id = req.query.id;
            let result;
            if (id) {
                const query = { _id: ObjectId(id) };
                const result = await bookingCollection.deleteOne(query);
                res.send(result);
            }
        })

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Helloooo!Programmers.How are you?');
})


app.listen(port, () => {
    console.log(`Listening to the port ${port}`);
})