const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
};

const getUserByEmail = email => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

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
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.send('400 - Bad Request<br>Enter an email and a password.');
  } else if (getUserByEmail(req.body.email)) {
    res.send('400 - Bad Request<br>This email is already registered.');
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', userID);
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  if (req.cookies['user_id']) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// POST route for '/login', where it creates a cookie with the user_id upon request if email exists and password matches
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email);
  if (!user || user.password !== req.body.password) {
    res.send('403 - Forbidden<br>Incorrect email or password.');
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
  }
});

// POST route for '/logout', where it deletes the cookie user_id upon request
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// POST route for '/urls', where a new short URL with its long URL is added to database and displayed in the page
app.post('/urls', (req, res) => {
  if (!req.cookies['user_id']) {
    res.send("You must login to be able to shorten URLs");
  } else {
    const id = generateRandomString();
    urlDatabase[id] = req.body.longURL;
    res.redirect(`/urls/${id}`);
  }
});

// GET route for '/urls/new', where it displays a page where one can submit a new url. It uses the urls_new.ejs template
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.cookies['user_id']] };
  if (!req.cookies['user_id']) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
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
  if (!longURL) {
    res.send('<h5>404 - Not Found</h5><p>The requested short URL could not be found on this server</p>')
  } else {
    res.redirect(longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});