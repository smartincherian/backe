const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority')
const Schema = mongoose.Schema;

var userSchema = new Schema({
    address: String,
    approved: Boolean,
    company: String,
    courses: String,
    designation: String,
    email: String,
    id: Number,
    name: String,
    password: String,
    phone: Number,
    photo: String,
    qualification: String,
    skill: String,
    type: String,
  });

var UserInfo = mongoose.model('users', userSchema);

module.exports = UserInfo;