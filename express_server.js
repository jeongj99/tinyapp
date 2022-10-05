// Function that generates the short URL; used in the /urls/new POST route
const generateRandomString = () => {
  let string = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    const randomNum = Math.floor(Math.random() * characters.length);
    string += characters[randomNum];
  }
  return string;
};

const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// GET route for '/', where it just redirects to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// GET route for '/urls.json' shows a JSON object literal of urlDatabase
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// GET route for '/urls', where it displays the an html browser using the urls_index.ejs
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_index', templateVars);
});

app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.post('/register', (req, res) => {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', userID);
  console.log(users);
  res.redirect('/urls');
});

// POST route for '/login', where it creates a cookie with the username upon request
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// POST route for '/logout', where it deletes the cookie with the username upon request
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

// POST route for '/urls', where a new short URL with its long URL is added to database and displayed in the page
app.post('/urls', (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// GET route for '/urls/new', where it displays a page where one can submit a new url. It uses the urls_new.ejs template
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  res.render('urls_new', templateVars);
});

// Get route for '/urls/:id', where id parameter is the short URL. urls_show.ejs used for template
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

// POST route for 'urls/:id', where it edits the long URL in the database and the change is displayed in the /url page upon request
app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.editedLongURL;
  res.redirect('/urls');
});

// POST route for '/urls/:id/delete', where it upon request deletes the selected url from the database and the change is displayed in /urls
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// GET route for /u/:id, where it just redirects you the actual destination of the long URL
app.get('/u/:id', (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});