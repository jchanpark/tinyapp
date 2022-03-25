const express = require("express");
const app = express();
const PORT = 8080;
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const helpers = require("./helpers");
const findUserByEmail = helpers.findUserByEmail;
const urlsForUser = helpers.urlsForUser;

app.set("view engine", "ejs");
app.use(morgan("dev"));
app.use(cookieParser());

const bodyParser = require("body-parser");
const res = require("express/lib/response");
app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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
}

app.get("/", (req, res) => {
  res.send("Hello!")
});

app.get("/urls", (req, res) => {
  // const user = users[req.cookies.user_id];
  const templateVars = { urls: urlsForUser(req.cookies.user_id, urlDatabase), user: users[req.cookies.user_id], email: users[req.cookies.user_id] ? users[req.cookies.user_id].email : null };
  res.render("urls_index", templateVars);

})

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies.user_id };
  // console.log('urlDatabase',urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user_id: req.cookies.user_id, user: users[req.cookies.user_id] ? users[req.cookies.user_id] : null, email: users[req.cookies.user_id] ? users[req.cookies.user_id].email : null };
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.send("error 403 - please login first.");
  }
})

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  res.redirect(urlDatabase[shortURL].longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const longURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = { longURL: longURL, userID: req.cookies.user_id };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies.user_id === urlDatabase[req.params.shortURL].user_id) {
    delete urlDatabase[req.params.shortURL];
  } else {
    res.send("error 403 - please login first");
  }  
})

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

  const userRandomId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.send(`error 400 - please enter an email or password`);
  } else if (findUserByEmail(req.body.email, users)) {
    return res.send(`error 400 - the email is already exist`)
  }

  users[userRandomId] = {
    id: userRandomId,
    email: email,
    password: hashedPassword
  }
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

