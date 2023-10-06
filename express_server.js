const express = require("express");
const cookieParser = require("cookie-parser");
const { urlsForUser } = require("./helper_functions");
const getUserByEmail = require("./helper_functions").getUserByEmail;
const authenticateUser = require("./helper_functions").authenticateUser;
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

const urlDatabase = {};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

//make a get request to main page of URLs list
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.send("You must be logged in to use this feature")
  } else {
    const filteredDatabase = urlsForUser(urlDatabase, userId)
    const templateVars = {
      urls: filteredDatabase,
      user: users[req.cookies["user_id"]]
    };
    res.render("urls_index", templateVars);
  }
});

//make a get request to page to create a new tiny link
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];

  if (!userId) {
    return res.redirect("/login");
  } else {
    const templateVars = {
      user: users[userId]
    }
    res.render("urls_new", templateVars)
  }
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("That shortened url does not exist")
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

app.get("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  } else if (!req.cookies["user_id"]) {
    return res.send("You must be logged in to see this page")
  } else if (userId !== urlId.userID) {
    return res.send("Only the account holder may view this page")
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlId.longURL,
      user: users[userId]
    };
    return res.render("urls_show", templateVars);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//endpoint for a get request to the /register page
app.get("/register", (req, res) => {
  //since we use the header partial which includes values from our database, must have a templateVars
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.render("register", templateVars);
  } else {
    res.redirect("/urls");
  }
})

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (!req.cookies["user_id"]) {
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
})

//endpoint to handle a post request to /login
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  const { error, user } = authenticateUser(users, email, password);

  if (error === "No user found") {
    return res.status(403).send("Account with that email address cannot be found");
  } else if (error === "Password doesn't match") {
    return res.status(403).send("Password is incorrect");
  } else {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
})

//endpoint for post request to /register
app.post("/register", (req, res) => {
  const randomUserId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //using the input form body, check if there is a user with that email
  if (!email || !password) {
    return res.status(400).send("Email address and password cannot be empty");
  } else if (getUserByEmail(users, email)) {
    return res.status(400).send("There is already an account with this email address");
  }

  users[randomUserId] = {
    id: randomUserId,
    email: req.body.email,
    password: req.body.password
  }

  res.cookie("user_id", randomUserId);
  res.redirect("/urls");
})

//logout endpoint to clear username cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login")
})

//POST route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  } else if (!req.cookies["user_id"]) {
    return res.send("You must be logged in to delete an entry")
  } else if (userId !== urlId.userID) {
    return res.send("Only the account holder may delete an entry")
  } else {
  //extract id we need to delete from the url of the request
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect("/urls")
  }
});

//make a post request so that when the submit button of the "make a new url" form is submitted, the user will be redirected to /urls/newId
//the req.body will be equal to one kay-value pair where the key is equal to the "name" value of the form, which in this case is longURL
app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];

  if (!userId) {
    return res.send("You must be logged in to use our services.");
  } else {
    const randomStringId = generateRandomString();
    urlDatabase[randomStringId] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    }
    res.redirect(`/urls/${randomStringId}`);
  }
});

//make a post request to update the url
//redirect client to /urls page to see updated url
//update the database so that the id will be paired with the updated url
app.post("/urls/:id", (req, res) => {
  const userId = req.cookies["user_id"];
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  } else if (!req.cookies["user_id"]) {
    return res.send("You must be logged in to see this page")
  } else if (userId !== urlId.userID) {
    return res.send("Only the account holder may view this page")
  } else {
    urlDatabase[req.params.id].longURL = req.body.newURL;
    res.redirect("/urls")
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});