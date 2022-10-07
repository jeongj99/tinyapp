const urlDatabase = {};

const users = {};

const {
  getUserByEmail,
  generateRandomString,
  urlsForUser
} = require('./helpers');

const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const express = require('express');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['tiny', 'app']
}));
app.use(methodOverride('_method'));

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
    user: users[req.session.user_id],
    usersURLs: urlsForUser(req.session.user_id, urlDatabase)
  };
  if (!users[req.session.user_id]) {
    res.render('urls_notLoggedIn', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

app.get('/register', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('register');
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('400 - Bad Request<br>Enter an email and a password.');
  } else if (getUserByEmail(req.body.email, users)) {
    res.send('400 - Bad Request<br>This email is already registered.');
  } else {
    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

app.get('/login', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// POST route for '/login', where it creates a cookie with the user_id upon request if email exists and password matches
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    res.send('403 - Forbidden<br>Incorrect email or password.');
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

// POST route for '/logout', where it deletes the cookie user_id upon request
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// POST route for '/urls', where a new short URL with its long URL is added to database and displayed in the page
app.post('/urls', (req, res) => {
  if (!users[req.session.user_id]) {
    res.send("You must login to be able to shorten URLs");
  } else {
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${id}`);
  }
});

// GET route for '/urls/new', where it displays a page where one can submit a new url. It uses the urls_new.ejs template
app.get('/urls/new', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (!users[req.session.user_id]) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

// Get route for '/urls/:id', where id parameter is the short URL. urls_show.ejs used for template
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    url: urlDatabase[req.params.id],
    user: users[req.session.user_id],
    usersURLs: urlsForUser(req.session.user_id, urlDatabase)
  };
  res.render('urls_show', templateVars);
});

// POST route for 'urls/:id', where it edits the long URL in the database and the change is displayed in the /url page upon request
app.put('/urls/:id', (req, res) => {
  const id = req.params.id;
  const usersURL = urlsForUser(req.session.user_id, urlDatabase);
  if (!urlDatabase[req.params.id]) {
    res.send('This ID does not exist');
  } else if (!users[req.session.user_id]) {
    res.send('Please login or register');
  } else if (!usersURL[req.params.id]) {
    res.send('You do not have access to this url');
  } else {
    urlDatabase[id].longURL = req.body.editedLongURL;
    res.redirect('/urls');
  }
});

// Delete route for '/urls/:id', where it upon request deletes the selected url from the database and the change is displayed in /urls
app.delete('/urls/:id/delete', (req, res) => {
  const usersURL = urlsForUser(req.session.user_id, urlDatabase);
  if (!urlDatabase[req.params.id]) {
    res.send('This ID does not exist');
  } else if (!users[req.session.user_id]) {
    res.send('Please login or register');
  } else if (!usersURL[req.params.id]) {
    res.send('You do not have access to this url');
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});

// GET route for /u/:id, where it just redirects you the actual destination of the long URL
app.get('/u/:id', (req, res) => {
  const url = urlDatabase[req.params.id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id],
    usersURLs: urlsForUser(req.session.user_id, urlDatabase)
  };
  if (!users[req.session.user_id]) {
    res.render('urls_notLoggedin', templateVars);
  } else if (!url) {
    res.send('<h5>404 - Not Found</h5><p>The requested short URL could not be found on this server</p>');
  } else if (!usersURLs[req.params.id]) {
    res.send('<h5>Access Denied</h5><p>You do not own this url</p>');
  } else {
    res.redirect(url.longURL);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});