const generateRandomString = () => {
  let string = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * characters.length);
    string += characters[randomNum];
  }
  return string;
};

const getUserByEmail = (email, database) => {
  for (const data in database) {
    if (database[data].email === email) {
      return database[data];
    }
  }
};

const urlsForUser = (id, database) => {
  const usersURLs = {};
  for (const url in database) {
    if (database[url].userID === id) {
      usersURLs[url] = database[url].longURL;
    }
  }
  return usersURLs;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};