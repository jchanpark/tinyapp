const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");
const helpers = require("./helpers");
const findUserByEmail = helpers.findUserByEmail;

app.set("view engine", "ejs");
app.use(cookieParser());

const bodyParser = require("body-parser");
const res = require("express/lib/response");
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!")
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
})

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL]);
});

app.post("/urls/:shortURL", (req, res) => {
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
})

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.send(`403 No user found with this email`);
  }
  if (user.password !== password) {
    return res.send(`403 Password does not match`);
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("register", templateVars);
})

app.post("/register", (req, res) => {
  // check if the email or password do not exit send 400 error, messaging "enter proper email and password"
  // if the user exist send 400 error, messaging "the email already exist"
  // console.log('users1', users);
  const userRandomId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.send(`error 400 - please enter an email or password`);
  } else if (findUserByEmail(req.body.email, users)) {
    return res.send(`error 400 - the email is already exist`)
  }

  users[userRandomId] = {
    id: userRandomId,
    email,
    password,
  }
  console.log('users2', users);
  res.cookie("user_id", userRandomId);
  res.redirect("/urls");
})

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("login", templateVars);
})





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

