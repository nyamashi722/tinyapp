const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

let emailAddress = "user2@example.com"

const getUserByEmail = function(users, emailAddress) {
  for (let user in users) {
    if (users[user].email === emailAddress) {
      return users[user];
    }
  }
  return null;
};

console.log(getUserByEmail(users, emailAddress))


const authenticateUser = function(users, email, password) {
  const user = getUserByEmail(users, email);

    if (!user) {
      return { error: "No user found", user: null}
    }

    if(user.password === password) {
      return { error: "Password doesn't match", user: null}
    }

    return { error: null, user }
}

const { error, user } = authenticateUser(arg1, arg2, arg3)

if (error) {

}