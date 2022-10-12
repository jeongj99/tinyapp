// Object with id (short URL) as key and another object with the long URL and userId as keys
const urlDatabase = {};

// Object with user id as key and an object with id (value = random string), email (value = email) and password (value = hashed password) as keys
const users = {};

module.exports = {
  urlDatabase,
  users
}