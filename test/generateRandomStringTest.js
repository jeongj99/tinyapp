const { assert } = require('chai');

const { generateRandomString } = require('../helpers.js');

describe('generateRandomString', () => {
  it('should different random string everytime called', () => {
    const randomStringOne = generateRandomString();
    const randomStringTwo = generateRandomString();
    assert.notEqual(randomStringOne, randomStringTwo);
  }) 
});