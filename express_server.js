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

app.get("/", (req, res) => {
  res.send("Hello!");
});

//endpoint to handle a post request to /login
app.post("/login", (req, res) => {
  //input form body is saved in req.cookie as the form name "username"
  res.cookie("username", req.body.username);
  res.redirect("/urls");
})

//logout endpoint to clear username cookie
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
})

//make a get request to main page of URLs list
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render("urls_index", templateVars);
});

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


//make a get request to page to create a new tiny link
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
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
    username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});