const findUserByEmail = function(email, users) {
  for (let userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return;
};

const urlsForUser = function(id, urlDatabase) {
  let urlsToDisplay = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urlsToDisplay[key] = urlDatabase[key];
    }
  }
  return urlsToDisplay;
}



module.exports = { findUserByEmail, urlsForUser };