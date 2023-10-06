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
      userUrls[url] = urls[url];
    }
  }
  return userUrls;
};

module.exports = {
  getUserByEmail,
  urlsForUser
};