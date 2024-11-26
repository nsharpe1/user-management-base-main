const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    const errorMessage = request.query.error || null;
    return response.render('login', { errorMessage });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const requestBody = request.body;

    const user = USERS.find((user) => user.email === requestBody.email);
    if (!user || !bcrypt.compareSync(requestBody.password, user.password)) {
      console.error("Invalid credentials");
      return response.redirect('/login?error=Invalid email or password');
    }

    if(user.role === 'admin') {
        return response.redirect('/adminlanding');
    }
    if(user.role === 'user') {
        return response.redirect('/landing');
    }
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    const errorMessage = request.query.error || null;
    return response.render('signup', { errorMessage });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { email, username, password } = request.body;
    if (USERS.find((user) => user.username === username)) {
      return response.status(400).render('signup', {errorMessage: 'Username is taken'});
    }

    USERS.push({ id: USERS.id + 1, username, email, password: bcrypt.hashSync(password, SALT_ROUNDS), role: 'user' });
    console.log(USERS);
    return response.redirect('/');
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    console.log(USERS);
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    response.render("landing");
});

app.get("/adminlanding", (request, response) => {
    response.render("adminlanding");
});

app.post('/logout', (request, response) => {
    request.session.destroy((error) => {
        if (error) {
            return response.status(500).send('Failed to log out.');
        }
        response.redirect('/');
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
