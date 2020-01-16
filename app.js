var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash       = require("connect-flash"),
    methodOverride = require("method-override"),
    LocalStrategy = require("passport-local"),
    passport = require("passport"),
    User = require("./models/user"),
    Alumni = require("./models/alumni"),
    request = require('request'),
    nodemailer = require('nodemailer'),
    twilio = require('twilio');
var config = require('./config/config.js');
var client = new twilio(config.twilio.accountSid, config.twilio.authToken);
//change
const pug = require('pug');
const _ = require('lodash');
const path = require('path');


mongoose.connect("mongodb+srv://nikhil:1234@cluster0-x9arn.mongodb.net/auth_demo_app", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
    .then(() => console.log('DB Connected! '))
    .catch(err => {
        console.log("DB Connection Error: ${err.message}");
    });

    app.use(flash());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

app.use(methodOverride("_method"));

//change donate
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(__dirname, 'public/')));

const {Donor} = require('./models/donor')
const {initializePayment, verifyPayment} = require('./config/paystack')(request);

app.get('/donate',(req, res) => {
    res.render('index1.pug');
});
app.post('/paystack/pay', (req, res) => {
    const form = _.pick(req.body,['amount','email','full_name']);
    form.metadata = {
        full_name : form.full_name
    }
    form.amount *= 100;
    
    initializePayment(form, (error, body)=>{
        if(error){
            //handle errors
            console.log(error);
            return res.redirect('/error.pug')
            return;
        }
        response = JSON.parse(body);
        res.redirect(response.data.authorization_url)
    });
});

app.get('/paystack/callback', (req,res) => {
    const ref = req.query.reference;
    verifyPayment(ref, (error,body)=>{
        if(error){
            //handle errors appropriately
            console.log(error)
            return res.redirect('/error.pug');
        }
        response = JSON.parse(body);        

        const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);

        [reference, amount, email, full_name] =  data;
        
        newDonor = {reference, amount, email, full_name}

        const donor = new Donor(newDonor)

        donor.save().then((donor)=>{
            if(!donor){
                return res.redirect('/error.pug');
            }
            res.redirect('/receipt/'+donor._id);
        }).catch((e)=>{
            res.redirect('/error.pug');
        })
    })
});

app.get('/receipt/:id', (req, res)=>{
    const id = req.params.id;
    Donor.findById(id).then((donor)=>{
        if(!donor){
            //handle error when the donor is not found
            res.redirect('/error.pug')
        }
        res.render('success.pug',{donor});
    }).catch((e)=>{
        res.redirect('/error.pug')
    })
})

app.get('/error', (req, res)=>{
    res.render('error.pug');
})


//change ended

// Passport setup

app.use(require('express-session')({
    secret: "Once again rusty wins the cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
    next();
});

app.get("/", function (req, res) {
    res.render("landing");
});


// Alumni.remove({}, function(err) {
//     if (err) {
//         console.log(err);
//     }
// });

//PAGES routes
app.get("/StudentScholarships",function(req,res){
  res.render("StudentScholarships");
});
app.get("/YFA",function(req,res){
  res.render("YFA");
});
app.get("/HATS",function(req,res){
  res.render("HATS");
});
app.get("/iCAN",function(req,res){
  res.render("iCAN");
});
app.get("/FinancialAid",function(req,res){
  res.render("financial");
});
app.get("/RIG",function(req,res){
  res.render("RIG");
});
app.get("/lifemem",function(req,res){
  res.render("lifemem");
});
app.get("/reunion",function(req,res){
  res.render("reunion");
});
app.get("/HATS",function(req,res){
  res.render("HATS");
});
app.get("/fundamental",function(req,res){
  res.render("fundamental");
});
app.get("/chapters",function(req,res){
  res.render("chapters");
});
app.get("/classgro",function(req,res){
  res.render("classgro");
});
app.get("/calendar",function(req,res){
  res.render("calendar")
});


//INDEX ROUTE - show all alumnis
app.get("/alumni", function (req, res) {
    // Get all alumnis from DB
    Alumni.find({}, function (err, allalumni) {
        if (err) {
            console.log(err);
        } else {
            res.render("index", {
                alumni: allalumni
            }); //data + name passing in
        }
    });
});

//SEARCH Alumni

app.get("/alumni/search", function (req, res) {
    res.render("search.ejs");
});

app.post("/search", function (req, res) {

    var alumni = req.body;

    var query, query2, query3;
    var name, batch;

    if (req.body.name) {
        query = req.body.name;
    } else {
        query = { $exists: true };
    }

    if (req.body.batch) {
        query2 = req.body.batch;
    } else {
        query2 = { $exists: true };
    }

    if (req.body.college) {
        query3 = req.body.college;
    } else {
        query3 = { $exists: true };
    }
    var query4;
    if (req.body.branch) {
        query4 = req.body.branch;
    } else {
        query4 = { $exists: true };
    }

    // var college = req.body.college;

    //console.log(college + " HEheh");
    // res.send("HI MAN THIS IS SEARCH");

    Alumni.find({ name: query, batch: query2, college: query3, branch: query4 }, function (err, alumni) {

        if (err) {
            console.log(err);
            console.log("OOPS there's an error");

        } else {

            alumni.forEach(function (alumni_) {
                // console.log(alumni_.name + " HAHA");
            });

            res.render("index.ejs", { alumni: alumni });
        }

    });

    // Alumni.find({ title: { $regex: new RegExp(title1) } }, function(err, blog) {
    // if (err) {
    //     console.log("OOPS there's an error");

    // } else {
    //     res.render("index.ejs", { blog: blog });
    // }
    // });

    //  db.products.find( { sku: { $regex: /789$/ } } )

});

//Send Email ROUTES

app.get("/alumni/:id/email", function (req, res) {

    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            console.log(foundalumni);
            res.render("email", {
                alumni: foundalumni
            });
        }
    });

    // res.render("email.ejs", { alumni: alumni });
});

app.post("/alumni/:id/email", function (req, res) {
    //res.render("email.ejs");

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.mlab.username,
            pass: config.mlab.password,
        }
    });
    const string1 = req.params;
    var subject = req.body.Subject;
    var text = req.body.text;

    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/alumni/" + foundalumni._id);

            var string = 'rk915582@gmail.com' + ', ' + 'ranbirdka123@gmail.com';

            var mailOptions = {
                from: 'rk915582@gmail.com',
                to: foundalumni.email,
                subject: subject,
                text: text
                // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    });
});

//Send Message ROUTES

app.get("/alumni/:id/message", function (req, res) {
    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            console.log(foundalumni);
            res.render("message", {
                alumni: foundalumni
            });
        }
    });
});

app.post("/alumni/:id/message", function (req, res) {


    var sender = '+12016769896';

    var message = req.body.text;
    // Details about Visitor $ { name }
    // Name: $ { name }
    // Email: $ { email }
    // Phone: $ { number }
    // Checkin Time: $ { currtime }
    // Visiting ID: $ { id }
    // `;


    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/alumni/" + foundalumni._id);
            receiver = foundalumni.mobile;
            client.messages.create({
                to: receiver,
                from: sender,
                body: message
            })
                .then(message => console.log(`
                Checkin SMS sent to Host: $ { foundalumni.name }
                ` + message.sid))
                .catch((error) => {
                    console.log(error);
                });
        }
    })
});

//CREATE - add new alumni to database
app.post("/alumni", isLoggedIn, function (req, res) {

    //get data from form and add to thriftstore array


    request('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyAPzLdcKEPCe4SQf3-cdSnq5vmh_MRaHCs' +
        '&address=' + encodeURIComponent(req.body.address),
        function (error, response, body) {
            if (error) {
                console.log('error!', error);
            } else {

                var data = JSON.parse(body);

                // console.log('data: ', util.inspect(data, { showHidden: false, depth: null }))

                if (data.results && data.results[0] && ["address_components"]) {
                    var addressComponents = data.results[0]["address_components"]
                    for (var i = 0; i < addressComponents.length; i++) {
                        if (
                            addressComponents[i]['types'].indexOf('sublocality_level_1') > -1 ||
                            addressComponents[i]['types'].indexOf('locality') > -1) {
                            var city = addressComponents[i]['long_name'];
                        }
                        if (addressComponents[i]['types'].indexOf('administrative_area_level_1') > -1) {
                            var state = addressComponents[i]['short_name'];
                        }
                        if (addressComponents[i]['types'].indexOf('country') > -1) {
                            var country = addressComponents[i]['long_name'];
                        }
                    }
                } else {
                    var city = null,
                        state = null,
                        country = null;
                }

                var newalumni = {
                    name: req.body.name,
                    image: req.body.image,
                    branch: req.body.branch,
                    batch: req.body.batch,
                    address: req.body.address,
                    college: req.body.college,
                    city: city,
                    state: state,
                    country: country,
                    mobile: req.body.mobile,
                    email: req.body.email,
                    image: req.body.image,

                    author: {
                        id: req.user._id,
                        username: req.user.username,
                        name: req.user.name
                    }
                };
                Alumni.create(newalumni, function (err, newlyCreated) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.flash("success", "Welcome to Alumni Portal " + alumni.name);
                        res.redirect("/alumni");
                    }
                });
            }
        });

});


//NEW - show form to create
app.get("/alumni/new", isLoggedIn, function (req, res) {
    res.render("new.ejs")
});

//SHOW - shows more info about campground selected - to be declared after NEW to not overwrite
app.get("/alumni/:id", function (req, res) {
    //find the campground with the provided ID
    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("show", {
                alumni: foundalumni
            });
        }
    });
});

///EDIT ROUTES

app.get("/alumni/:id/edit", checkAuthorization, function (req, res) {

    Alumni.findById(req.params.id, function (err, foundalumni) {
        if (err) {
            console.log(err);

        } else {
            res.render("alumni/edit", { alumni: foundalumni });
        }
    });

});

//UPDATE ROUTES

app.put("/alumni/:id", checkAuthorization, function (req, res) {
    Alumni.findByIdAndUpdate(req.params.id, req.body.alumni, function (err, updatedalumni) {
        if (err) {
            res.redirect("/alumni");
        } else {
            req.flash("success", "Profile Successfully Updated! ");
            res.redirect("/alumni/" + req.params.id);
        }
    });
});

app.delete("/alumni/:id", checkAuthorization, function (req, res) {
    Alumni.findByIdAndRemove(req.params.id, function (err, newalumni) {
        if (err) {
            res.redirect("/alumni");

        } else {
            req.flash("success", "Profile Successfully Deleated! ");
            res.redirect("/alumni");
        }
    });
});

function checkAuthorization(req, res, next) {
    if (req.isAuthenticated()) {
        Alumni.findById(req.params.id, function (err, foundalumni) {
            if (err) {
                res.redirect("back");

            } else {


                if (foundalumni.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }
            }
        });

    } else {
        res.redirect("back");
    }
}


//AUTH ROUTES

app.get("/register", function (req, res) {
    res.render("register");

});

//Handle user sign up

app.post("/register", function (req, res) {

    var newuser = new User({ username: req.body.username });

    if (req.body.adminCode === 'alumniCollege123') {
        newuser.isAdmin = true;
    }

    User.register(newuser, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            console.log(err);
            return res.render("register");

        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to Alumni Portal " + alumni.name);
            res.redirect("/alumni");

 
        });

    });


});

//LOGIN routes

app.get("/login", function (req, res) {
    res.render("login");

});

//HAndle login page
app.post("/login", passport.authenticate("local", {
    successRedirect: "/alumni",
    failureRedirect: "/login"

}), function (req, res) {

});

//LOGOUT ROUTE
app.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/alumni");
})


//Is login check for adding comments
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

app.listen(3000, function () {
    console.log(" Jai Mata Di Alumni server has started!");
});
