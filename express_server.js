// Databases------------
const { urlDatabase, users } = require('./databases');

// Helper functions-------
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser
} = require('./helpers');

// Dependencies-----------------------------------
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const express = require('express');
const app = express();
const PORT = 8080;

// Allows the use of templates ejs store in folder views
app.set('view engine', 'ejs');

// Middleware-----------------------------------
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['tiny', 'app']
}));
app.use(methodOverride('_method'));

// GET ROUTES----------------------------------------------------------------------------------------------------------------

// GET route for '/', where it just redirects to /urls
app.get('/', (req, res) => {
  res.redirect('/urls');
});

// GET route for '/urls', where it displays urls_notLoggedIn if not logged in, otherwise it renders urls_index
app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    user,
    usersURLs
  };
  if (!user) {
    res.render('urls_notLoggedIn', templateVars);
  } else {
    res.render('urls_index', templateVars);
  }
});

// GET route for '/register', where it redirects to /urls if logged in, otherwise it renders register
app.get('/register', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user
  };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('register', templateVars);
  }
});

// GET route for '/login', where it redirects to /urls if logged in, otherwise it renders login
app.get('/login', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user
  };
  if (user) {
    res.redirect('/urls');
  } else {
    res.render('login', templateVars);
  }
});

// GET route for '/urls/new', where it redirects to /urls if not logged in, otherwise it renders urls_new
app.get('/urls/new', (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = { user };
  if (!user) {
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

/*
GET route for '/urls/:id':
If not logged in -> renders urls_notLoggedIn
If shortURL (id) does not exist -> renders shortURLDNE
If user does not have access to shortURL -> renders doNotHaveAccess
Otherwise -> renders urls_show
*/
app.get('/urls/:id', (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    id,
    url,
    user,
    usersURLs
  };
  if (!user) {
    res.render('urls_notLoggedIn', templateVars);
  } else if (!url) {
    res.render('shortURLDNE', templateVars);
  } else if (!usersURLs[id]) {
    res.render('doNotHaveAccess', templateVars);
  }
  else {
    res.render('urls_show', templateVars);
  }
});

/*
GET route for '/u/:id':
If not logged in -> renders urls_notLoggedIn
If shortURL (id) does not exist -> renders shortURLDNE
If user does not have access to shortURL -> renders doNotHaveAccess
Otherwise -> redirects to url.longURL (the actual url)
*/
app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    id,
    url,
    user,
    usersURLs
  };
  if (!url) {
    res.render('shortURLDNE', templateVars);
  } else {
    res.redirect(url.longURL);
  }
});

// POST ROUTES-----------------------------------------------------------------------------------------------------

/*
POST route for '/register':
If email or password are empty -> status code: 400; renders emptyRegistration
If email exists in the users database -> status code: 400; renders alreadyRegistered
Otherwise -> creates a userID, hashes the entered password, and it is stored in the users database.
A session cookie is created and redirects to /urls
*/
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (email === '' || password === '') {
    res.status(400).render('emptyRegistration', templateVars);
  } else if (getUserByEmail(email, users)) {
    res.status(400).render('alreadyRegistered', templateVars);
  } else {
    const userID = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[userID] = {
      id: userID,
      email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

/*
POST route for '/login':
If email is not registerd or password doesn't match -> status code: 403; renders failedLogin
Otherwise -> creates a session cookie and redirects to /urls
*/
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  const enteredPassword = req.body.password;
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (!user || !bcrypt.compareSync(enteredPassword, user.password)) {
    res.status(403).render('failedLogin', templateVars);
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }
});

// POST route for '/logout', where it deletes the cookies upon request and redirects to /urls
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

/*
POST route for '/urls':
If user is not logged in -> renders urls_notLoggedIn
Otherwise -> creates an id (short URL) for the long URL entered and it is stored in the urlDatabase. Redirects to /urls/:id.
*/
app.post('/urls', (req, res) => {
  const user = users[req.session.user_id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    user,
    usersURLs
  };
  if (!user) {
    res.render('urls_notLoggedIn', templateVars);
  } else {
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect(`/urls/${id}`);
  }
});

// PUT ROUTES------------------------------------------------------------

/*
PUT route for '/urls/:id':
If user is not logged in -> renders urls_notLoggedIn
If short URL (id) does not exist -> renders shortURLDNE
If user does not have access to shortURL -> renders doNotHaveAccess
If an empty long URL is entered -> no edit; redirects to /urls
Otherwise -> Accesses urlsDatabase and changes the long URL value of a short URL key. Redirects to /urls
*/
app.put('/urls/:id', (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const edited = req.body.editedLongURL;
  const templateVars = {
    id,
    url,
    user,
    usersURLs
  };
  if (!user) {
    res.render('urls_notLoggedIn', templateVars);
  } else if (!url) {
    res.render('shortURLDNE', templateVars);
  } else if (!usersURLs[id]) {
    res.render('doNotHaveAccess', templateVars);
  } else if (edited === '') {
    res.redirect('/urls');
  } else {
    urlDatabase[id].longURL = edited;
    res.redirect('/urls');
  }
});

// DELETE ROUTES-------------------------------------------------------------------------------------------------------------------------

/*
PUT route for '/urls/:id':
If user is not logged in -> renders urls_notLoggedIn
If short URL (id) does not exist -> renders shortURLDNE
If user does not have access to shortURL -> renders doNotHaveAccess
Otherwise -> Deletes the short URL (key) and long URl (value) from urlsDatabase
*/

app.delete('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];
  const usersURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    id,
    url,
    user,
    usersURLs
  };
  if (!user) {
    res.render('urls_notLoggedIn', templateVars);
  } else if (!url) {
    res.render('shortURLDNE', templateVars);
  } else if (!usersURLs[id]) {
    res.render('doNotHaveAccess', templateVars);
  } else {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});