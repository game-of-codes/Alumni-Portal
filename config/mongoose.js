const mongoose = require ('mongoose');

mongoose.connect("mongodb+srv://nikhil:1234@cluster0-x9arn.mongodb.net/auth_demo_app", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
    .then(() => console.log('DB Connected 2!'))
    .catch(err => {
        console.log("DB Connection Error: ${err.message}");
    });

module.exports = {mongoose}