const { assert } = require('chai');

const { urlsForUser } = require('../helpers.js');

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

describe('urlsForUser', () => {
  it('should return an object of shortURLs and longURLs key-value pair', () => {
    const userID = 'aJ48lW';
    const usersURLs = urlsForUser(userID, urlDatabase);
    const expectedOutput = {
      b6UTxQ: "https://www.tsn.ca",
      i3BoGr: "https://www.google.ca"
    };
    assert.deepEqual(usersURLs, expectedOutput);
  });
  it('should return an empty object when none of the urls belong to the passed user', () => {
    const userID = 'efhu2';
    const usersURLs = urlsForUser(userID, urlDatabase);
    const expectedOutput = {};
    assert.deepEqual(usersURLs, expectedOutput);
  });
});