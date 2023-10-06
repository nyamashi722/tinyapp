const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { urlsForUser } = require("./helper_functions");
const getUserByEmail = require("./helper_functions").getUserByEmail;
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
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ //creates req.session
  name: "session",
  keys: ["gh3nyt5i65rua4t8hu"]
}))

const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  return res.send("Hello!");
});

//make a get request to main page of URLs list
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.send("You must be logged in to use this feature")
  }
  const filteredDatabase = urlsForUser(urlDatabase, userId)
  const templateVars = {
    urls: filteredDatabase,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

//make a get request to page to create a new tiny link
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[userId]
  }
  res.render("urls_new", templateVars)
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("That shortened url does not exist")
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  }
  if (!req.session.user_id) {
    return res.send("You must be logged in to see this page")
  }
  if (userId !== urlId.userID) {
    return res.send("Only the account holder may view this page")
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlId.longURL,
    user: users[userId]
  };
  return res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//endpoint for a get request to the /register page
app.get("/register", (req, res) => {
  //since we use the header partial which includes values from our database, must have a templateVars
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (!req.session.user_id) {
    return res.render("register", templateVars);
  }
  res.redirect("/urls");

})

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };

  if (!req.session.user_id) {
    return res.render("login", templateVars);
  }
  res.redirect("/urls");

})

//endpoint to handle a post request to /login
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please enter an email and password")
  }

  const foundUser = getUserByEmail(users, email)

  if (!foundUser) {
    return res.status(400).send("Account with that email address does not exist")
  }
  const result = bcrypt.compareSync(password, foundUser.password)
  if (!result) {
    return res.status(400).send("Incorrect password")
  }

  req.session.user_id = foundUser.id
  res.redirect("/urls");
})

//endpoint for post request to /register
app.post("/register", (req, res) => {
  const randomUserId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Email address and password cannot be empty");
  }
  //using the input form body, check if there is a user with that email
  if (getUserByEmail(users, email)) {
    return res.status(400).send("There is already an account with this email address");
  }

  users[randomUserId] = {
    id: randomUserId,
    email: req.body.email,
    password: hashedPassword
  }
  req.session.user_id = randomUserId;
  res.redirect("/urls");
})

//logout endpoint to clear username cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login")
})

//POST route that removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  }
  if (!req.session.user_id) {
    return res.send("You must be logged in to delete an entry")
  }
  if (userId !== urlId.userID) {
    return res.send("Only the account holder may delete an entry")
  }
  //extract id we need to delete from the url of the request
  const { id } = req.params;
  delete urlDatabase[id];
  res.redirect("/urls")
});

//make a post request so that when the submit button of the "make a new url" form is submitted, the user will be redirected to /urls/newId
//the req.body will be equal to one kay-value pair where the key is equal to the "name" value of the form, which in this case is longURL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.send("You must be logged in to use our services.");
  }
  const randomStringId = generateRandomString();
  urlDatabase[randomStringId] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect(`/urls/${randomStringId}`);
});

//make a post request to update the url
//redirect client to /urls page to see updated url
//update the database so that the id will be paired with the updated url
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const urlId = urlDatabase[req.params.id];
  if (!urlId) {
    return res.send("This url does not exist")
  }
  if (!req.session.user_id) {
    return res.send("You must be logged in to see this page")
  }
  if (userId !== urlId.userID) {
    return res.send("Only the account holder may view this page")
  }
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});