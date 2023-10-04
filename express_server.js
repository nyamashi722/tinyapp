const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

const generateRandomString = function () {
  const alphanumericValues = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * alphanumericValues.length);
    randomString += alphanumericValues.charAt(index);
  }
  return randomString;
};

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  // userRandomID: {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur",
  // },
  // user2RandomID: {
  //   id: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk",
  // },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

//make a get request to main page of URLs list
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

//make a get request to page to create a new tiny link
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//endpoint for a get request to the /register page
app.get("/register", (req, res) => {
  //since we use the header partial which includes values from our database, must have a templateVars
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("register", templateVars)
})

app.get("/login", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars)
})

//endpoint to handle a post request to /login
app.post("/login", (req, res) => {
  //input form body is saved in req.cookie as the form name "username"
  res.cookie("username", req.body.username);
  res.redirect("/urls");
})

//endpoint for post request to /register
app.post("/register", (req, res) => {
  const randomUserId = generateRandomString()
  users[randomUserId] = {
    id: randomUserId,
    email: req.body.email,
    password: req.body.password
  }
  //assign value of the user_id linked to the cookie to a variable
  const userCookie = req.cookies["user_id"];

  //check if an email is already registered based on the cookie user_id.
  //First, must check if there even is a cookie saved and then check if there is an email linked to it.
  //Or else, if someone registers for the first time, there won't be a cookie and the code will look for an email for an undefined value
  if (!users[randomUserId].email || !users[randomUserId].password) {
    res.status(400).send("Email address and password cannot be empty");
  } else if (users[userCookie] && users[userCookie].email) {
    res.status(400).send("There is already an account with this email address");
  }

  res.cookie("user_id", randomUserId);
  res.redirect("/urls");
})

//logout endpoint to clear username cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
})

//POST route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  //extract id we need to delete from the url of the request
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect("/urls")
});

//make a post request so that when the submit button of the "make a new url" form is submitted, the user will be redirected to /urls/newId
//the req.body will be equal to one kay-value pair where the key is equal to the "name" value of the form, which in this case if longURL
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  console.log(req.body)
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

//make a post request to update the url
//redirect client to /urls page to see updated url
//update the database so that the id will be paired with the updated url
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});