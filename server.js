// requirements

const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const PORT = 2121
require('dotenv').config()

//connect to mongoDB
let db,
    dbConnectionStr = process.env.DB_STRING,
    dbName = 'todo'

MongoClient.connect(dbConnectionStr, { useUnifiedTopology: true })
    .then(client => {
        console.log(`Connected to ${dbName} Database`)
        db = client.db(dbName)
    })

//middleware
app.set('view engine', 'ejs') //allows us to use html templates
app.use(express.static('public')) // allows us to load static files from public folder
app.use(express.urlencoded({ extended: true })) //allows us to access the url
app.use(express.json()) //allows us to parse JSON format variables


//get the page, loads the DB entries
app.get('/',async (request, response)=>{
    const todoItems = await db.collection('todos').find({deleted: false}).toArray() //create array of all the notes
    const itemsLeft = await db.collection('todos').countDocuments({completed: false, deleted: false})  //number of items that are not complete
    response.render('index.ejs', { items: todoItems, left: itemsLeft }) // send a response of a render of the .ejs html template
    // db.collection('todos').find().toArray()
    // .then(data => {
    //     db.collection('todos').countDocuments({completed: false})
    //     .then(itemsLeft => {
    //         response.render('index.ejs', { items: data, left: itemsLeft })
    //     })
    // })
    // .catch(error => console.error(error))
})

// creates a new ToDo
app.post('/addTodo', (request, response) => {
    const newDocument = {
        thing: request.body.todoItem, 
        completed: false,
        deleted: false
    }
    db.collection('todos').insertOne(newDocument) // insert a new note on the todos collection
    .then(result => {
        console.log('Todo Added') // log confirms
        response.redirect('/') // reload page
    })
    .catch(error => console.error(error))
})

//changes the property of completed of a specific todo
app.put('/markComplete', (request, response) => {
    db.collection('todos').updateOne({thing: request.body.itemFromJS},{ // filters based on itemFromJS
        $set: { //changes
            completed: true
          }
    },{
        sort: {_id: -1},
        upsert: false // doesnt create in case it doesnt exist
    })
    .then(result => {
        console.log('Marked Complete') // log in case of success
        response.json('Marked Complete')
    })
    .catch(error => console.error(error))

})

//same as above
app.put('/markUnComplete', (request, response) => { 
    db.collection('todos').updateOne({thing: request.body.itemFromJS},{
        $set: {
            completed: false
          }
    },{
        sort: {_id: -1},
        upsert: false
    })
    .then(result => {
        console.log('Marked Uncomplete')
        response.json('Marked Complete')
    })
    .catch(error => console.error(error))

})

//delete item
app.put('/deleteItem', (request, response) => {
    db.collection('todos').updateOne({thing: request.body.itemFromJS},
       {
            $set: {
                deleted: true
            }
        },
        {
        sort: {_id: -1},
        upsert: false
       }) 
    .then(result => {
        console.log('Todo Deleted')
        response.json('Todo Deleted')
    })
    .catch(error => console.error(error))

})

//server listens on env.PORT
app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})