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

app.use(bodyParser.urlencoded({extended:true}));
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


app.post('/add_rm_games', function(req, res) {

	console.log(req.body);

	//add game to catalogue
	if(req.body.add == "addGame") {

		var query = "INSERT INTO Board_Games VALUES (NULL, ?, ?, ?, ?, ?)";
		var inserts = [req.body.game_name, req.body.min_num, req.body.max_num, req.body.rating, req.body.year];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			res.render('add_rm_games');
		});
	}

	//add genre to existing game
	else if(req.body.add == "addGenre") {

		//first, insert the genre into Genres (if it already exists, ignore it)
		var query = "INSERT IGNORE INTO Genres VALUES (NULL, ?)";
		var inserts = [req.body.game_genre];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			//next, add entry into Game_Genres intersection table
			var query2 = "INSERT IGNORE INTO Game_Genres VALUES ((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT genre_ID FROM Genres WHERE genre_name = ?));"
			var inserts2 = [req.body.game_name, req.body.genre_name];

			mysql.pool.query(query2, inserts2, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}

				res.render('add_rm_games');
			});
		});
	}

	//add creator to existing game
	else if(req.body.add == "addCreator") {

		//if the last name is an empty string, replace with NULL
		if(req.body.creator_lname == '') {
			var lname = null;
		} else {
			var lname = req.body.creator_lname;
		}

		//first, do a query to check if the creator's first and last name are in the database
		//query if lname is null
		if(lname == null) {
			var query = "SELECT age FROM Creators WHERE first_name = ? AND last_name IS NULL";
			var inserts = [req.body.creator_fname]
		} else { //query if lname is not null
			var query = "SELECT age FROM Creators WHERE first_name = ? AND last_name = ?";
			var inserts = [req.body.creator_fname, req.body.creator_lname];
		}

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			console.log(results);

			//if the resulting query was empty, insert the creator into Creators first
			if(results.length == 0) {


				//insert the creator into Creators (if it already exists, ignore it)
				var query = "INSERT IGNORE INTO Creators VALUES (NULL, ?, ?, NULL)";
				var inserts = [req.body.creator_fname, lname];

				mysql.pool.query(query, inserts, function(error, results, fields) {
					if(error) {
						res.write(JSON.stringify(error));
						res.end();
					}

					//then, insert into Game_Creators
					//query if lname is NULL
					if(lname == null) {
						var query2 = "INSERT IGNORE INTO Game_Creators VALUES((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name IS NULL))";
						var inserts2 = [req.body.game_name, req.body.creator_fname];
					} else { //query if lname is not Null
						var query2 = "INSERT IGNORE INTO Game_Creators VALUES((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name = ?))";
						var inserts2 = [req.body.game_name, req.body.creator_fname, lname];
					}

					mysql.pool.query(query2, inserts2, function(error, results, fields) {
						if(error) {
							res.write(JSON.stringify(error));
							res.end();
						}

						res.render('add_rm_games');
					});
				});
			}

			//else if the query was not empty, go straight to inserting into GameCreators
			else{

				//query if lname is NULL
				if(lname == null) {
					var query2 = "INSERT IGNORE INTO Game_Creators VALUES((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name IS NULL))";
					var inserts2 = [req.body.game_name, req.body.creator_fname];
				} else { //query if lname is not Null
					var query2 = "INSERT IGNORE INTO Game_Creators VALUES((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name = ?))";
					var inserts2 = [req.body.game_name, req.body.creator_fname, lname];
				}

				mysql.pool.query(query2, inserts2, function(error, results, fields) {
					if(error) {
						res.write(JSON.stringify(error));
						res.end();
					}

					res.render('add_rm_games');
				});
			}

		});
	}

	//updating creator age
	else if(req.body.add == "updateAge") {

		//if the last name is an empty string, replace with NULL
		if(req.body.creator_lname == '') {
			var lname = null;
		} else {
			var lname = req.body.creator_lname;
		}

		//query if lname is NULL
		if(lname == null) {
			var query = "UPDATE Creators SET age = ? WHERE first_name = ? AND last_name IS NULL";
			var inserts = [req.body.creator_age, req.body.creator_fname]
		} else { //query if lname is not null
			var query = "UPDATE Creators SET age = ? WHERE first_name = ? AND last_name = ?";
			var inserts = [req.body.creator_age, req.body.creator_fname, req.body.creator_lname];
		}

		//update the age of the customer
		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			res.render('add_rm_games');
		});
	}

	//delete game from catalogue
	//add game to catalogue
	else if(req.body.add == "deleteGame") {

		//first, delete from Game_Genres if it exists
		var query = "DELETE FROM Game_Genres WHERE board_game_ID = (SELECT board_game_ID FROM Board_Games WHERE game_name = ?)";
		var inserts = [req.body.game_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			//next, delete from Game_Creators if it exists
			var query2 = "DELETE FROM Game_Creators WHERE board_game_ID = (SELECT board_game_ID FROM Board_Games WHERE game_name = ?)";
			var inserts2 = [req.body.game_name];

			mysql.pool.query(query2, inserts2, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}

				//finally, delete from Board_Games
				var query3 = "DELETE FROM Board_Games WHERE game_name = ?";
				var inserts3 = [req.body.game_name];

				mysql.pool.query(query3, inserts3, function(error, results, fields) {
					if(error) {
						res.write(JSON.stringify(error));
						res.end();
					}

					res.render('add_rm_games');
				});
			});
		});
	}
});


//edit customers page
app.get('/add_rm_update_customers', function(req, res) {
	res.render('add_rm_update_customers');
});

app.post('/add_rm_update_customers', function(req, res) {

    console.log(req.body);

    //add game to catalogue
    if(req.body.add == "addCustomer") {

        var query = "INSERT INTO Customers VALUES (NULL, ?, ?, ?, ?, 0, NULL, NULL)";
        var inserts = [req.body.first_name, req.body.last_name, req.body.email, req.body.phone];

        mysql.pool.query(query, inserts, function(error, results, fields) {
            if(error) {
                res.write(JSON.stringify(error));
                res.end();
            }

            res.render('add_rm_update_customers');
        });
    }

	//delete customer
    if(req.body.add == "deleteCustomer") {

    	var query = "DELETE FROM Customers WHERE first_name = ? AND last_name = ?";
   	 	var inserts = [req.body.first_name, req.body.last_name];

	    mysql.pool.query(query, inserts, function(error, results, fields) {
	        if(error) {
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        res.render('add_rm_update_customers');
	    });
	}

	//update customer debts
    if(req.body.add == "updateCustomerDebt") {

    	var query = "UPDATE `Customers` SET debt = ? WHERE first_name = ? AND last_name = ?";
   	 	var inserts = [req.body.debt, req.body.first_name, req.body.last_name];

	    mysql.pool.query(query, inserts, function(error, results, fields) {
	        if(error) {
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        res.render('add_rm_update_customers');
	    });
	}

	//update customer favorite creator
		if(req.body.add == "updateCustomerFavoriteCreator") {
			//if the last name is an empty string, replace with NULL

			if(req.body.creator_lname == '') {
				var lname = null;
			} else {
				var lname = req.body.creator_lname;
			}

			//query if lname is NULL
			if(lname == null) {
				var query = "UPDATE Customers SET favorite_creator = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name IS NULL) WHERE first_name = ? AND last_name = ?";
				var inserts = [req.body.creator_fname, req.body.first_name, req.body.last_name]
			} else { //query if lname is not null
				var query = "UPDATE Customers SET favorite_creator = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name = ?) WHERE first_name = ? AND last_name = ?";
				var inserts = [req.body.creator_fname, lname, req.body.first_name, req.body.last_name];
			}

			mysql.pool.query(query, inserts, function(error, results, fields) {
					if(error) {
							res.write(JSON.stringify(error));
							res.end();
					}

					res.render('add_rm_update_customers');
			});
	}

	//update customer favorite genre
	if(req.body.add == "updateCustomerFavoriteGenre") {

		var query = "UPDATE Customers SET favorite_genre = (SELECT genre_ID FROM Genres WHERE genre_name = ?) WHERE first_name = ? AND last_name = ?";
		var inserts = [req.body.genre_name, req.body.first_name, req.body.last_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
				if(error) {
						res.write(JSON.stringify(error));
						res.end();
				}

				res.render('add_rm_update_customers');
		});
	}

	 //delete customer favorite creator
	 if(req.body.add == "deleteCustomerFavoriteCreator") {

 		var query = "UPDATE Customers SET favorite_creator = NULL WHERE first_name = ? AND last_name = ?";
 		var inserts = [req.body.first_name, req.body.last_name];

 		mysql.pool.query(query, inserts, function(error, results, fields) {
 				if(error) {
 						res.write(JSON.stringify(error));
 						res.end();
 				}

 				res.render('add_rm_update_customers');
 		});
 	}

	//delete customer favorite creator
	if(req.body.add == "deleteCustomerFavoriteGenre") {

	 var query = "UPDATE Customers SET favorite_genre = NULL WHERE first_name = ? AND last_name = ?";
	 var inserts = [req.body.first_name, req.body.last_name];

	 mysql.pool.query(query, inserts, function(error, results, fields) {
			 if(error) {
					 res.write(JSON.stringify(error));
					 res.end();
			 }

			 res.render('add_rm_update_customers');
	 });
 }

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

	var customerList = {};
	console.log(req.query.fname);

	var query = "SELECT first_name, last_name, email, phone, debt, favorite_creator, favorite_genre FROM Customers WHERE first_name LIKE ? AND last_name LIKE ?";
	var inserts = ["%" + req.query.fname + "%", "%" + req.query.lname + "%"];

	mysql.pool.query(query, inserts, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		customerList.customer = results;

		var subquery = "SELECT first_name, last_name FROM Creators WHERE creator_ID = ?";
		console.log(customerList.customer[0].favorite_creator);
		var subinserts = [customerList.customer[0].favorite_creator];
		mysql.pool.query(subquery, subinserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			customerList.creator = results;
			var subsubquery = "SELECT genre_name FROM Genres WHERE genre_ID = ?";
			var subsubinserts = [customerList.customer[0].favorite_genre];
			mysql.pool.query(subsubquery, subsubinserts, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}
				customerList.genre = results;
				res.render('customer', customerList);
				console.log(customerList);
			});
		});
	});

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