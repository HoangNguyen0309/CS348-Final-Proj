const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');


const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'h20081974',
	database : 'nodelogin'
});

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

// http://localhost:3000/
app.get('/', function(request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/login.html'));
});
console.log("bruh");

// LOGIN
// http://localhost:3000/auth
app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				console.log("bruh: " + results[0]);
				request.session.loggedin = true;
				request.session.username = username;
				request.session.bio = results[0].bio;
				request.session.name = results[0].name;
				// Redirect to home page
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

// http://localhost:3000/home
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!' 
		+ '\nName: ' + request.session.bio);
		//response.sendFile(path.join(__dirname + '/home.html'));
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

// function to call the frontend page for editing
// change home.html as needed
app.get('/profile', function(request, response) { 
	response.sendFile(path.join(__dirname + '/home.html'));
});

// function to update the profile backend and save data
// To update other profile information add variables after SET var = ?
// request.body requests the inputted variable
// console will say "Update succesful" if profile update succeeds.
// Query: 'UPDATE accounts SET bio = ? WHERE username = ?', inputs: profile (variable for user input) and request.session.username
app.post('/editProfile', function(request, response) { 
	let profile = request.body.profile;
	connection.query('UPDATE accounts SET bio = ? WHERE username = ?', [profile, request.session.username], (error, results, fields) => {
		if (error) throw error;
		else {
			response.send('Profile updated succesfully');
		}
	});
});
// TESTING:
// post('')
// Render the page for deleting a user
app.get('/deleteUser', function(request, response) {
    response.sendFile(path.join(__dirname + '/deleteUser.html'));
});

// Handle the user deletion form submission
app.post('/deleteUser', function(request, response) {
    let usernameToDelete = request.body.usernameToDelete;

    // Check if the username exists
    connection.query('SELECT * FROM accounts WHERE username = ?', [usernameToDelete], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            // Username exists, proceed with deletion
            connection.query('DELETE FROM accounts WHERE username = ?', [usernameToDelete], (error) => {
                if (error) throw error;
                response.send('User deletion successful.');
            });
        } else {
            // Username doesn't exist
            response.send('User not found. Please enter a valid username.');
        }
    });
});

// ... (existing code)

app.get('/report', function(request, response) {
    // Render the report interface
    response.sendFile(path.join(__dirname + '/report.html'));
});

app.post('/generateReport', async function(request, response) {
    try {
        let selectedVariables = request.body.variables;

        if (!Array.isArray(selectedVariables)) {
            selectedVariables = [selectedVariables];
        }

        let selectClause = selectedVariables.join(', ');

        let sqlQuery = `SELECT ${selectClause} FROM accounts`;

        const [results, fields] = await connection.promise().query(sqlQuery);

        response.send('Generated Report:<br>' + JSON.stringify(results));
    } catch (error) {
        console.error('Error generating report:', error);
        response.status(500).send('Internal Server Error');
    }
});


app.listen(3001);