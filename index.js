const express = require('express');
const app = express()
const session = require('express-session')
const nocache = require('nocache');
const morgan = require('morgan')
const userRoute = require('./routes/userRoute')
const adminRoute = require('./routes/adminRoute')
const flash = require('express-flash')


require('./config/config').connect()

const {chatbox}=require('./controller/chatController')
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});

chatbox(server)



app.set('view engine','ejs')
app.set('views','views')

app.use(express.static('public'))
app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: false,
}));

app.use(flash())

app.use("/admin", adminRoute)
app.use("/", userRoute)



app.use((req, res, next) => {
  res.status(404).render('error');
});


// app.listen(process.env.PORT, () => {
//   console.log(`server is Running at http://localhost:${process.env.PORT}`);
// })