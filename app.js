var express= require("express");
var app=express();
var mongoose=require("mongoose");
var passport=require("passport");
var bodyParser=require("body-parser");
var User=require("./models/user");
// var College=require("./models/college"); //Change
// var Director=require("./models/director"); //Change
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");


mongoose.connect("mongodb://localhost:27017/auth_demo_app", {
useUnifiedTopology: true,
useNewUrlParser: true,
})
.then(() => console.log('DB Connected!'))
.catch(err => {
console.log("DB Connection Error: ${err.message}");
});

app.use(require("express-session")({
secret: "Nikhil is best",
resave:false,
saveUninitialized:false
}));

app.use(bodyParser.urlencoded({extended:true}));
app.use(passport.initialize());
app.use(passport.session());

//User
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// //College
// passport.use(new LocalStrategy(College.authenticate()));
// passport.serializeUser(College.serializeUser());
// passport.deserializeUser(College.deserializeUser());

// //Director
// passport.use(new LocalStrategy(Director.authenticate()));
// passport.serializeUser(Director.serializeUser());
// passport.deserializeUser(Director.deserializeUser());

app.set("view engine", "ejs");

//Routes
app.get("/",function(req,res){
    res.render("home");
});

app.get("/secret",isLoggedIn, function(req,res){
    res.render("secret");
})

// //changes
// app.get("/collegedash",isCLoggedIn, function(req,res){
//     res.render("collegedash");
// })
// app.get("/directoratedash",isDLoggedIn, function(req,res){
//     res.render("directoratedash");
// })

//Auth Routes
//Show Sign Up Form
app.get("/register",function(req,res){
    res.render("register");
});

//Handling user Sign up
app.post("/register",function(req,res){
    req.body.username
    req.body.password
    User.register(new User({username:req.body.username}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        //down here we use different strategy like fb,twitter
        passport.authenticate("local")(req,res,function(){
            res.redirect('/secret');
        });
    })
});

app.get("/logina",function(req,res){
    res.render("logina");
});

//change
app.get("/loginc",function(req,res){
    res.render("loginc");
});
app.get("/logind",function(req,res){
    res.render("logind");
});


//middleware
app.post("/logina",passport.authenticate("local",{
    successRedirect: "/secret",
    failureRedirect: "/logina"
}),
function(req,res){
    
});

// //change
// app.post("/loginc",passport.authenticate("local",{
//     successRedirect: "/collegedash",
//     failureRedirect: "/loginc"
// }),
// function(req,res){
// });
// app.post("/logind",passport.authenticate("local",{
//     successRedirect: "/directoratedash",
//     failureRedirect: "/logind"
// }),
// function(req,res){
// });
// //change end

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
});

//Middleware function to check login before secret page
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/logina");
}

// //change
// function isCLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/loginc");
// }
// function isDLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/logind");
// }
// //change end

app.get("*",function(req,res){
    res.send("Wrong page");
});
app.listen(3000,function(){
    console.log("Auth App Connected!");
});