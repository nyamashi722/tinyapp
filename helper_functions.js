const getUserByEmail = function(users, emailAddress) {
  for (let user in users) {
    if (users[user].email === emailAddress) {
      return users[user];
    }
  }
  return null;
};

const urlsForUser = function(urls, userId) {
  const userUrls = {};
  for (let url in urls) {
    if (urls[url].userID === userId) {
      userUrls[url] = urls[url]
    }
  }
  return userUrls
};

const authenticateUser = function(users, email, password) {
  let user = getUserByEmail(users, email);

    if (!user) {
      return { error: "No user found", user: null}
    }

    if(user.password !== password) {
      return { error: "Password doesn't match", user: null}
    }

    return { error: null, user }
}

module.exports = {
  getUserByEmail,
  authenticateUser,
  urlsForUser
}