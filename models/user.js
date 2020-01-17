var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: { type: Boolean, default: false },
    isRegistered: {type: Boolean , default: true}

});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);