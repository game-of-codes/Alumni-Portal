var mongoose = require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var DirectorSchema = new mongoose.Schema({
    username:String,
    password:String
});

DirectorSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Director", DirectorSchema);