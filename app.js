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
    expressSanitizer = require("express-sanitizer"),
    request = require('request'),
    nodemailer = require('nodemailer'),
    twilio = require('twilio');
    const http = require('http').Server(app);
    const io = require('socket.io')(http);
var config = require('./config/config.js');
var client = new twilio(config.twilio.accountSid, config.twilio.authToken);

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "testing.sih.web@gmail.com",
        pass: "theteam@1234"
    }
});
var rand, mailOptions, host, link;


//change
const pug = require('pug');
const _ = require('lodash');
const path = require('path');

app.use(express.static('./Template'));


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



//blog routes
app.use(expressSanitizer());

// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog", blogSchema);



// INDEX ROUTE
app.get("/blogs", function(req, res){
   Blog.find({}, function(err, blogs){
       if(err){
           console.log("ERROR!");
       } else {
          res.render("indexblog", {blogs: blogs}); 
       }
   });
});

// NEW ROUTE
app.get("/blogs/new", function(req, res){
    res.render("newblog");
});

// CREATE ROUTE
app.post("/blogs", function(req, res){
    // create blog
    console.log(req.body);
    req.body.blog.body= req.sanitize(req.body.blog.body)
    console.log("===========")
    console.log(req.body);
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("newblog");
        } else {
            //then, redirect to the index
            res.redirect("/blogs");
        }
    });
});

// SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
           res.redirect("/blogs");
       } else {
           res.render("showblog", {blog: foundBlog});
       }
   })
});

// EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        } else {
            res.render("editblog", {blog: foundBlog});
        }
    });
})


// UPDATE ROUTE
app.put("/blogs/:id", function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body)
   Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
      if(err){
          res.redirect("/blogs");
      }  else {
          res.redirect("/blogs/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/blogs/:id", function(req, res){
   //destroy blog
   Blog.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/blogs");
       } else {
           res.redirect("/blogs");
       }
   })
   //redirect somewhere
});




//end of blog routes


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
            //console.log(foundalumni);
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
                    name: req.body.firstname,
                    name2: req.body.lastname,
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
                        username: req.user.username
                    }
                };
                
                Alumni.create(newalumni, function (err, newlyCreated) {
                    if (err) {
                        console.log(err);
                    } else {
                        User.findByIdAndUpdate(
                            { _id: req.user._id },
                            { change: 2 },
                            function(err, result) {
                              if (err) {
                                res.send(err);
                              }
                            }
                          );
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

    var newuser = new User({ 
        username: req.body.username ,
        firstname: req.body.firstname,
        enrollment: req.body.enrollment,
        change: 1
        // avatar: req.body.avatar
    });
    if (req.body.adminCode === 'alumniCollege123') {
        newuser.isAdmin = true;
    }
    if((req.body.enrollment >= 180000 && req.body.enrollment <= 200000) || (req.body.adminCode === 'alumniCollege123')){
    User.register(newuser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Successfully Signed Up! Nice to meet you ");
            res.render("verify");
        });
    });
}//if close
else{
    req.flash("error","Student not available in our database!");
    res.redirect('register');
}
});

app.get('/send', function (req, res) {
    rand = Math.floor((Math.random() * 100) + 54);
    host = req.get('host');
    link = "http://" + req.get('host') + "/verify?id=" + rand;
    mailOptions = {
        to: req.query.to,
        subject: "Please confirm your Email account",
        html: "Hello,<br> Please Click on the link to verify your email.<br><a href=" + link + ">Click here to verify</a>"
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("Message sent: " + response.message);
            res.end("sent");
        }
    });
});

app.get('/verify', function (req, res) {
    console.log(req.protocol + ":/" + req.get('host'));
    if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        console.log("Domain is matched. Information is from Authentic email");
        if (req.query.id == rand) {
            console.log("email is verified");
             alert("verification link is sent to your email!! verify and login")
            res.redirect("/alumni");
        }
        else {
            console.log("email is not verified");
            res.end("<h1>Bad Request</h1>");
        }
    }
    else {
        res.end("<h1>Request is from unknown source");
    }
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
    res.redirect("/");
})


//Is login check for adding comments
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

//chat routes
app.get("/chat", function(req, res) {
    res.render('chat.ejs');
  
});

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '???? <i>' + socket.username + ' join the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '???? <i>' + socket.username + ' left the chat..</i>');
    })

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
    });

});


//job routes
app.use(expressSanitizer());

// MONGOOSE/MODEL CONFIG
var jobSchema = new mongoose.Schema({
    title: String,
    joblink: String,
    body: String,
    created: {type: Date, default: Date.now}
});
var Job = mongoose.model("Job", jobSchema);

// INDEX ROUTE
app.get("/jobs", function(req, res){
   Job.find({}, function(err, jobs){
       if(err){
           console.log("ERROR!");
       } else {
          res.render("indexjob", {jobs: jobs}); 
       }
   });
});
// NEW ROUTE
app.get("/jobs/new", function(req, res){
    res.render("newjob");
});

// CREATE ROUTE
app.post("/jobs", function(req, res){
    // create job
    console.log(req.body);
    req.body.job.body= req.sanitize(req.body.job.body)
    console.log("===========")
    console.log(req.body);
    Job.create(req.body.job, function(err, newJob){
        if(err){
            res.render("newjob");
        } else {
            //then, redirect to the index
            res.redirect("/jobs");
        }
    });
});

// SHOW ROUTE
app.get("/jobs/:id", function(req, res){
   Job.findById(req.params.id, function(err, foundJob){
       if(err){
           res.redirect("/jobs");
       } else {
           res.render("showjob", {job: foundJob});
       }
   })
});

// EDIT ROUTE
app.get("/jobs/:id/edit", function(req, res){
    Job.findById(req.params.id, function(err, foundJob){
        if(err){
            res.redirect("/jobs");
        } else {
            res.render("editjob", {job: foundJob});
        }
    });
})


// UPDATE ROUTE
app.put("/jobs/:id", function(req, res){
    req.body.job.body = req.sanitize(req.body.job.body)
   Job.findByIdAndUpdate(req.params.id, req.body.job, function(err, updatedJob){
      if(err){
          res.redirect("/jobs");
      }  else {
          res.redirect("/jobs/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/jobs/:id", function(req, res){
   //destroy job
   Job.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/jobs");
       } else {
           res.redirect("/jobs");
       }
   })
   //redirect somewhere
});




//end of job routes


//notice routes
app.use(expressSanitizer());

// MONGOOSE/MODEL CONFIG
var noticeSchema = new mongoose.Schema({
    title: String,
    noticelink: String,
    body: String,
    created: {type: Date, default: Date.now}
});
var Notice = mongoose.model("Notice", noticeSchema);



// INDEX ROUTE
app.get("/notices", function(req, res){
   Notice.find({}, function(err, notices){
       if(err){
           console.log("ERROR!");
       } else {
          res.render("indexnotice", {notices: notices}); 
       }
   });
});

// NEW ROUTE
app.get("/notices/new", function(req, res){
    res.render("newnotice");
});

// CREATE ROUTE
app.post("/notices", function(req, res){
    // create notice
    console.log(req.body);
    req.body.notice.body= req.sanitize(req.body.notice.body)
    console.log("===========")
    console.log(req.body);
    Notice.create(req.body.notice, function(err, newNotice){
        if(err){
            res.render("newnotnotice");
        } else {
            //then, redirect to the index
            res.redirect("/notices");
        }
    });
});

// SHOW ROUTE
app.get("/notices/:id", function(req, res){
   Job.findById(req.params.id, function(err, foundNotice){
       if(err){
           res.redirect("/notices");
       } else {
           res.render("shownotice", {notice: foundNotice});
       }
   })
});

// EDIT ROUTE
app.get("/notices/:id/edit", function(req, res){
    Notice.findById(req.params.id, function(err, foundNotice){
        if(err){
            res.redirect("/notices");
        } else {
            res.render("editnotice", {notice: foundNotice});
        }
    });
})


// UPDATE ROUTE
app.put("/notices/:id", function(req, res){
    req.body.notice.body = req.sanitize(req.body.notice.body)
   Notice.findByIdAndUpdate(req.params.id, req.body.notice, function(err, updatedNotice){
      if(err){
          res.redirect("/notices");
      }  else {
          res.redirect("/notices/" + req.params.id);
      }
   });
});

// DELETE ROUTE
app.delete("/notices/:id", function(req, res){
   //destroy notice
   Notice.findByIdAndRemove(req.params.id, function(err){
       if(err){
           res.redirect("/notices");
       } else {
           res.redirect("/notices");
       }
   })
   //redirect somewhere
});

//end of notice routes

const server = http.listen(8080, function() {
    console.log('listening on *:8080');
});