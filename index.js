const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mhth.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const app = express()
app.use(cors())
app.use(bodyParser.json())



const serviceAccount = require("./config/burj-al-arab-20f7a-firebase-adminsdk-l9ap1-692b218b66.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
     databaseURL: process.env.DB_FIRE
});


const port = 5000



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collectionBookings = client.db("burjAlArab").collection("bookings");
    // console.log('connection successfully done');

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collectionBookings.insertOne(newBooking)
            .then(result => {
                // console.log(result);
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        console.log(req.headers.authorization)

        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            admin.auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    console.log(tokenEmail, queryEmail);
                    if (tokenEmail == queryEmail) {
                        collectionBookings.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    }

                })
                .catch((error) => {
                    res.status(401).send('un-authorized accessed');
                });
        }
        else
        {
            res.status(401).send('un-authorized accessed');
        }

    })

});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)