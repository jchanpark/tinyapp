const express = require("express");
const app = express();
const PORT = 8080;
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { findUserByEmail, urlsForUser, generateRandomString } = require("./helpers");

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(cookieSession({
  name: "session",
  keys: ["encript", "decript"]
})
);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
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
};

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  // check if the user is not logged in, redirect to login
  const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id], email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  //  check if the user is not logged, redirect to login
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // TODO check if user is logged in if not send error 'you must be logged in to create short urls'
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  // console.log('urlDatabase',urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user_id: req.session.user_id, user: users[req.session.user_id] ? users[req.session.user_id] : null, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL].longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  // return an error if the user is not logged in and trying to edit.
  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.session.user_id };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {

  const shortU = req.params.shortURL;
  console.log('shortU', shortU);
  if (req.session.user_id === urlDatabase[shortU].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else {
    res.send("error 403 - please login first");
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.send(`403 No user found with this email`);
  }
  const hashedPassword = user.password;

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.send(`403 Password does not match`);
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  const userRandomId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.send(`error 400 - please enter an email or password`);
  } else if (findUserByEmail(req.body.email, users)) {
    return res.send(`error 400 - the email is already exist`);
  }

  users[userRandomId] = {
    id: userRandomId,
    email: email,
    password: hashedPassword
  };
  
  req.session.user_id = userRandomId;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  // if a user is already logged in then redirect to "/urls"
  const templateVars = { user: users[req.session.user_id]};
  res.render("login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

