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

// Main page to be redirected to login page
app.get("/", (req, res) => {
  res.redirect("/login");
});

// if user_id exists in the uers database its email to be provided
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlsForUser(req.session.user_id, urlDatabase), user: users[req.session.user_id], email: users[req.session.user_id] ? users[req.session.user_id].email : null };
// if the user is logged in whose own URLs to be displayed
  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.render('urls_error', templateVars); //if the user is not logged in, redirected to error page
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
    // if the user is logged in the page to create a new URL rendered otherwise redirected to login page
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  // A new user object added to urlDatabase
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortURL}`);
});

// if user_id exists in the urlDatabase url edit page is rendered otherwise redirected to login page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user_id: req.session.user_id, user: users[req.session.user_id] ? users[req.session.user_id] : null, email: users[req.session.user_id] ? users[req.session.user_id].email : null };
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect("/login");
  }
});

// to redirect to the longURL coresponding to the shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL].longURL);
});

// to add a user's urls and user_id to the urlDatabase
app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.session.user_id };
  res.redirect("/urls");
});

// if the user_id exists delete its shortURL in the database
app.post("/urls/:shortURL/delete", (req, res) => {

  const shortU = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortU].userID) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else {
    res.send("error 403 - please login first");
  }
});

// function to search a user email id in the data base
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.send(`403 No user found with this email`);
  }
  const hashedPassword = user.password;
  // hashed password is to be compared with the logging in password
  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.send(`403 Password does not match`);
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// cookie session to be deleted when logged out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// if user_id exists redirectd to URLs page 
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id]};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
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
  const templateVars = { user: users[req.session.user_id]};
  // if the user is logged in redirected to URLs page
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars); // if the user is not logged in the login page rendered
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

