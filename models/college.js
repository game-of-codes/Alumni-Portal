var mongoose = require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var CollegeSchema = new mongoose.Schema({
    username:String,
    password:String
});

CollegeSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("College", CollegeSchema);