const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/user_management_system");

const express = require("express");
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//user Routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

//admin Routes
const adminRoute = require('./routes/adminRoute');
app.use('/', adminRoute);

app.listen(3000, () => {
    console.log("Server listening to port 3000...");
})