/*
Otherworldly Games

A project by Group 28: Fellowship of Databases

Team Members:
Nancy Nguyen
Katelyn Lindsey

main.js
*/

var express = require('express');
var mysql = require('./dbcon.js');
var bodyParser = require('body-parser');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]); //may need to change this

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use('/', express.static('public'));


//main page
app.get('/', function(req, res) {
	res.render('index');
});


//edit games page
app.get('/add_rm_games', function(req, res) {
	res.render('add_rm_games');
});


//edit customers page
app.get('/add_rm_update_customers', function(req, res) {
	res.render('add_rm_update_customers');
});


//view all creators page
app.get('/creators', function(req, res) {

	var creatorList = {};

	mysql.pool.query("SELECT first_name, last_name FROM Creators ORDER BY first_name ASC", function(error, results, fields) {
		if(error) {

			res.write(JSON.stringify(error));
			res.end();
		}

		creatorList.creators = results;

		res.render('creators', creatorList);
	})

});


//view all genres page
app.get('/genres', function(req, res) {

	var genreList = {};

	mysql.pool.query("SELECT genre_name FROM Genres ORDER BY genre_name ASC", function(error, results, fields) {
		if(error) {

			res.write(JSON.stringify(error));
			res.end();
		}

		genreList.genres = results;

		res.render('genres', genreList);
	})

});


//search customers page
app.get('/customer', function(req, res) {
	res.render('customer');
});


//search boardgames page
app.get('/boardgame', function(req, res) {
	res.render('boardgame');
});


//return game page
app.get('/return', function(req, res) {
	res.render('return');
})


//rent game page
app.get('/rental', function(req, res) {
	res.render('rental');
})


//404 error
app.use(function(req, res) {
	res.status(404);
	res.render('404');
});

//500 error
app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500);
	res.render('500');
});


app.listen(app.get('port'), function() {
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});