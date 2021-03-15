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


/***** THIS SECTION CONTAINS FUNCTIONS THAT ARE USED BY THE ROUTES *****/
function addFullName(customerList) {
	/*
	Takes a JSON with a list of customers and concatenates their first and last name
	to create a full name attribute.
	Returns the customerList.
	*/

	//iterate through the list of customers
	for(var i = 0; i < customerList.customer.length; i++) {
		customerList.customer[i].full_name = customerList.customer[i].first_name + " " + customerList.customer[i].last_name;
	}

	//return the customer list, now with full names
	return customerList;
}

function addFullCreatorName(creatorList) {
	/*
	Takes a JSON with a list of creators and concatenates their first and last name together
	(if they have a last name) to create a full name attribute.
	Returns the creatorList.
	*/

	//iterate through the list of creators
	for(var i = 0; i < creatorList.creator.length; i++) {
		//if the creator last name is null, full name is only first name
		if(creatorList.creator[i].last_name == null) {
			creatorList.creator[i].full_name = creatorList.creator[i].first_name;
		}
		//else, full name is first and last name
		else {
			creatorList.creator[i].full_name = creatorList.creator[i].first_name + " " + creatorList.creator[i].last_name;
		}
	}

	//return the creator list, now with full names
	return creatorList;
}

function addGenres(gameList, genreList) {
	/*
	Takes a JSON full of games and genres received from mySQL queries and
	adds the genres as a concatenated string to each game in the gameList.
	Returns the gameList.
	*/

	//for every game, add its genres to the string of genres
	//iterate through all genres
	for(var i = 0; i < genreList.length; i++) {

		//iterate through all games
		for(var j = 0; j < gameList.game.length; j++) {

			//if the board game ids are equal, add it to that game's string of genres
			if(gameList.game[j].board_game_ID == genreList[i].board_game_ID) {
				gameList.game[j].genres += (", " + genreList[i].genre_name);
			}
		}
	}

	//now, remove the extra ', ' from the start if the game's genres is not empty
	for(var i = 0; i < gameList.game.length; i++) {

		//if the genres string is not empty, remove ", "
		if(gameList.game[i].genres != "") {
			gameList.game[i].genres = gameList.game[i].genres.slice(2);
		}
	}

	//return the new and improved gameList with genres
	return gameList;
}

function addCreators(gameList, creatorList) {
	/*Takes a JSON full of games and creators received from mySQL queries and
	adds the creators as a concatenated string to each game in the gameList.
	Returns the gameList.
	*/

	//for every game, add its creators to the string of creators
	//iterate through all creators
	for(var i = 0; i < creatorList.length; i++) {

		//iterate through all games
		for(var j = 0; j < gameList.game.length; j++) {

			//if the board game ids are equal, add it to that game's string of creators
			if(gameList.game[j].board_game_ID == creatorList[i].board_game_ID) {

				//if there is a last name
				if(creatorList[i].last_name != null) {
					//add first and last name
					gameList.game[j].creators += (", " + creatorList[i].first_name + " " + creatorList[i].last_name);
				}
				//else, only add first name
				else{
					gameList.game[j].creators += (", " + creatorList[i].first_name);
				}
			}

		}

	}

	//now, remove the extra ', ' from the start if the game's creators is not empty
	for(var i = 0; i < gameList.game.length; i++) {

		//if the creators string is not empty, remove ", "
		if(gameList.game[i].creators != "") {
			gameList.game[i].creators = gameList.game[i].creators.slice(2);
		}
	}

	//return the new and improved gameList with creators
	return gameList;
}

function addFavoriteGenres(customerList, genreList) {
	/*
	Takes two JSONS, one with a list of customers and the other, genres. Changes the 
	genre ids of each customer's favorite customer to the genre name.
	Returns the customerList.
	*/

	//iterate through the list of customers
	for(var i = 0; i < customerList.customer.length; i++) {

		//if this customer has a favorite genre
		if(customerList.customer[i].favorite_genre != null) {

			//iterate through the list of genres
			for(var j = 0; j < genreList.length; j++) {

				//if the genre_ID is the same as the favorite genre
				if(genreList[j].genre_ID == customerList.customer[i].favorite_genre) {

					//set the favorite genre to the name of the genre instead of the id
					customerList.customer[i].favorite_genre = genreList[j].genre_name;
				}
			}
		}
	}

	//return the customer list, now with genre names
	return customerList;
}


function addFavoriteCreators(customerList, creatorList) {
	/*
	Takes two JSONS, one with a list of customers and the other, creators. Changes the 
	creator ids of each customer's favorite creator to the creator name.
	Returns the customerList.
	*/

	//iterate through the list of customers
	for(var i = 0; i < customerList.customer.length; i++) {

		//if this customer has a favorite creator
		if(customerList.customer[i].favorite_creator != null) {

			//iterate through the list of creators
			for(var j = 0; j < creatorList.length; j++) {

				//if the creator_ID is the same as the favorite creator
				if(creatorList[j].creator_ID == customerList.customer[i].favorite_creator) {

					//if the creator has a last name
					if(creatorList[j].last_name != null) {
						//add first and last name instead of id
						customerList.customer[i].favorite_creator = creatorList[j].first_name + " " + creatorList[j].last_name;
					}
					//else if there is no last name
					else{
						//add first name instead of id
						customerList.customer[i].favorite_creator = creatorList[j].first_name;
					}
				}
			}
		}
	}

	//return the customer list, now with creator names
	return customerList;
}



/***** MAIN PAGE (index.handlebars) - Contains Search Functionality for Board_Games and Customers *****/
app.get('/', function(req, res) {

	var customerList = {};

	//get all customers - for dropdown list in customer search
	var query = "SELECT * FROM Customers";

	mysql.pool.query(query, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		customerList.customer = results;

		//get the customer's full name
		customerList = addFullName(customerList);
		//console.log(customerList);

		res.render('index', customerList);
	});
});

function renderAddRmGames(req, res) {
	/*
	Renders the add_rm_games.handlebars page.
	*/

	var gameList = {};

	//first, get all of the board game information
	var query = "SELECT * FROM Board_Games ORDER BY game_name ASC";

	mysql.pool.query(query, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		gameList.game = results;

		//for every game in the list of results, add a Genres string and a Creators string
		for(var i = 0; i < gameList.game.length; i++) {
			gameList.game[i].genres = "";
			gameList.game[i].creators = "";
		}


		//next, get all of the game genres attached to board_games (with the names)
		var query2 = "SELECT Game_Genres.genre_ID, Game_Genres.board_game_ID, Genres.genre_name FROM Game_Genres INNER JOIN Genres ON Game_Genres.genre_ID = Genres.genre_ID";

		mysql.pool.query(query2, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			gameList = addGenres(gameList, results);
			//console.log(gameList);


			//next, get all of the creators attached to board games (with the names)
			var query3 = "SELECT Game_Creators.creator_ID, Game_Creators.board_game_ID, Creators.first_name, Creators.last_name FROM Game_Creators INNER JOIN Creators ON Game_Creators.creator_ID = Creators.creator_ID"

			mysql.pool.query(query3, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}

				gameList = addCreators(gameList, results);
				//console.log(gameList);

				//render the page
				res.render('add_rm_games', gameList);
			});
		});
	});
}


/***** 
ADD/EDIT GAMES PAGE (add_rm_games.handlebars) - Contains the ability to INSERT/DELETE/UPDATE Board_Games, 
INSERT/DELETE Game_Creators and Game_Genres, ADD Genres and Creators, and UPDATE Creators. 
*****/
app.get('/add_rm_games', function(req, res) {

	renderAddRmGames(req, res);
});


app.post('/add_rm_games', function(req, res) {

	//console.log(req.body);
	var gameList = {};

	//add game to catalogue
	if(req.body.add == "addGame") {

		var query = "INSERT INTO Board_Games VALUES (NULL, ?, ?, ?, ?, ?)";
		var inserts = [req.body.game_name, req.body.min_num, req.body.max_num, req.body.rating, req.body.year];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			renderAddRmGames(req, res);
		});
	}

	//add genre to existing game
	else if(req.body.add == "addGenre") {
		//console.log(req.body.genre_name);

		//first, do a query to check if the genre is already in the database
		var query = "SELECT * FROM Genres WHERE Genres.genre_name = ?";
		var inserts = [req.body.genre_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			//if the resulting query is empty, first insert into Genres, then insert into Game_Genres
			if(results.length == 0) {
				var query2 = "INSERT IGNORE INTO Genres VALUES (NULL, ?)";
				var inserts2 = [req.body.genre_name];

				mysql.pool.query(query2, inserts2, function(error, results, fields) {
					if(error) {
						res.write(JSON.stringify(error));
						res.end();
					}

					//next, add entry into Game_Genres intersection table
					var query3 = "INSERT IGNORE INTO Game_Genres VALUES ((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT genre_ID FROM Genres WHERE genre_name = ?));"
					var inserts3 = [req.body.game_name, req.body.genre_name];

					mysql.pool.query(query3, inserts3, function(error, results, fields) {
						if(error) {
							res.write(JSON.stringify(error));
							res.end();
						}

						renderAddRmGames(req, res);
					});
				});
			}

			//otherwise, just insert into Game_Genres
			else {
				var query2 = "INSERT IGNORE INTO Game_Genres VALUES ((SELECT board_game_ID FROM Board_Games WHERE game_name = ?), (SELECT genre_ID FROM Genres WHERE genre_name = ?));"
				var inserts2 = [req.body.game_name, req.body.genre_name];

				mysql.pool.query(query2, inserts2, function(error, results, fields) {
					if(error) {
						res.write(JSON.stringify(error));
						res.end();
					}

					renderAddRmGames(req, res);
				});
			}

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

			//console.log(results);

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

						renderAddRmGames(req, res);
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

					renderAddRmGames(req, res);
				});
			}

		});
	}
	//Delete existing genre in game
	else if (req.body.add == "deleteGenre"){
		var query = "DELETE FROM Game_Genres WHERE board_game_ID = (SELECT board_game_ID FROM Board_Games WHERE game_name = ?) AND genre_ID = (SELECT genre_ID FROM Genres WHERE genre_name = ?)";
		var inserts = [req.body.game_name, req.body.genre_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			renderAddRmGames(req, res);
		});
	}

	else if(req.body.add == "deleteCreator") {

		//if the last name is an empty string, replace with NULL
		if(req.body.creator_lname == '') {
			var lname = null;
		} else {
			var lname = req.body.creator_lname;
		}

		//first, do a query to check if the creator's first and last name are in the database
		//query if lname is null
		if(lname == null) {
			var query = "DELETE FROM Game_Creators WHERE board_game_ID = (SELECT board_game_ID FROM Board_Games WHERE game_name = ?) AND creator_ID = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name is NULL)";
			var inserts = [req.body.game_name, req.body.creator_fname];
		} else { //query if lname is not null
			var query = "DELETE FROM Game_Creators WHERE board_game_ID = (SELECT board_game_ID FROM Board_Games WHERE game_name = ?) AND creator_ID = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name = ?)";
			var inserts = [req.body.game_name, req.body.creator_fname, lname];
		}

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			renderAddRmGames(req, res);
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

			renderAddRmGames(req, res);
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

					renderAddRmGames(req, res);
				});
			});
		});
	}
});

function renderAddRmCustomer(req, res) {
	/* 
	Renders the add_rm_update_customers.handlebars page.
	*/

	var customerList = {};

	//first, get all of the customer information
	var query = "SELECT * FROM Customers ORDER BY last_name ASC";

	mysql.pool.query(query, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		customerList.customer = results;

		//concatenate the first and last name together
		for(var i = 0; i < customerList.customer.length; i++) {

			customerList.customer[i].full_name = customerList.customer[i].first_name + " " + customerList.customer[i].last_name;
		}

		//next, get all of the genres
		var query2 = "SELECT * FROM Genres";

		mysql.pool.query(query2, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			//change the customers' favorite genres to be the genre_name instead of the id
			customerList = addFavoriteGenres(customerList, results);


			//next, get all of the creators
			var query3 = "SELECT * FROM Creators";

			mysql.pool.query(query3, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}

				//change the customers' favorite creators to be the first_name (and last_name) instead of the id
				customerList = addFavoriteCreators(customerList, results);

				//render the page
				res.render('add_rm_update_customers', customerList);
			});
		});
	});
}


/***** ADD/EDIT CUSTOMERS PAGE (add_rm_update_customers) - Contains the ability to INSERT/DELETE/UPDATE Customers *****/
app.get('/add_rm_update_customers', function(req, res) {

	renderAddRmCustomer(res, res);
});

app.post('/add_rm_update_customers', function(req, res) {

    //add game to catalogue
    if(req.body.add == "addCustomer") {

        var query = "INSERT INTO Customers VALUES (NULL, ?, ?, ?, ?, 0, NULL, NULL)";
        var inserts = [req.body.first_name, req.body.last_name, req.body.email, req.body.phone];

        mysql.pool.query(query, inserts, function(error, results, fields) {
            if(error) {
                res.write(JSON.stringify(error));
                res.end();
            }

            renderAddRmCustomer(res, res);
        });
    }

	//delete customer
    else if(req.body.add == "deleteCustomer") {

    	//split full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];


    	var query = "DELETE FROM Customers WHERE first_name = ? AND last_name = ?";
   	 	var inserts = [first_name, last_name];

	    mysql.pool.query(query, inserts, function(error, results, fields) {
	        if(error) {
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        renderAddRmCustomer(res, res);
	    });
	}

	//update customer debts
    else if(req.body.add == "updateCustomerDebt") {

    	//split full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];

    	var query = "UPDATE `Customers` SET debt = ? WHERE first_name = ? AND last_name = ?";
   	 	var inserts = [req.body.debt, first_name, last_name];

	    mysql.pool.query(query, inserts, function(error, results, fields) {
	        if(error) {
	            res.write(JSON.stringify(error));
	            res.end();
	        }

	        renderAddRmCustomer(res, res);
	    });
	}

	//update customer favorite creator
	else if(req.body.add == "updateCustomerFavoriteCreator") {

		//split customer full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];

		//if the last name is an empty string, replace with NULL
		if(req.body.creator_lname == '') {
			var lname = null;
		} else {
			var lname = req.body.creator_lname;
		}

		//query if lname is NULL
		if(lname == null) {
			var query = "UPDATE Customers SET favorite_creator = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name IS NULL) WHERE first_name = ? AND last_name = ?";
			var inserts = [req.body.creator_fname, first_name, last_name]
		} else { //query if lname is not null
			var query = "UPDATE Customers SET favorite_creator = (SELECT creator_ID FROM Creators WHERE first_name = ? AND last_name = ?) WHERE first_name = ? AND last_name = ?";
			var inserts = [req.body.creator_fname, lname, first_name, last_name];
		}

		mysql.pool.query(query, inserts, function(error, results, fields) {
				if(error) {
						res.write(JSON.stringify(error));
						res.end();
				}

				renderAddRmCustomer(res, res);
		});
	}

	//update customer favorite genre
	else if(req.body.add == "updateCustomerFavoriteGenre") {

		//split customer full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];

		var query = "UPDATE Customers SET favorite_genre = (SELECT genre_ID FROM Genres WHERE genre_name = ?) WHERE first_name = ? AND last_name = ?";
		var inserts = [req.body.genre_name, first_name, last_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
				if(error) {
						res.write(JSON.stringify(error));
						res.end();
				}

				renderAddRmCustomer(res, res);
		});
	}

	 //delete customer favorite creator
	else if(req.body.add == "deleteCustomerFavoriteCreator") {

		//split customer full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];

 		var query = "UPDATE Customers SET favorite_creator = NULL WHERE first_name = ? AND last_name = ?";
 		var inserts = [first_name, last_name];

 		mysql.pool.query(query, inserts, function(error, results, fields) {
 				if(error) {
 						res.write(JSON.stringify(error));
 						res.end();
 				}

 				renderAddRmCustomer(res, res);
 		});
 	}

	//delete customer favorite creator
	else if(req.body.add == "deleteCustomerFavoriteGenre") {

		//split customer full name string into first and last name
    	var full_arr = req.body.full_name.split(" ");
    	var first_name = full_arr[0];
    	var last_name = full_arr[1];

		var query = "UPDATE Customers SET favorite_genre = NULL WHERE first_name = ? AND last_name = ?";
		var inserts = [first_name, last_name];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			renderAddRmCustomer(res, res);
		});
	}

});


/***** VIEW ALL CREATORS PAGE (creators) - Contains ability to SELECT Creators *****/
app.get('/creators', function(req, res) {

	var creatorList = {};

	mysql.pool.query("SELECT first_name, last_name FROM Creators ORDER BY first_name ASC", function(error, results, fields) {
		if(error) {

			res.write(JSON.stringify(error));
			res.end();
		}

		creatorList.creators = results;
		//console.log(results);

		res.render('creators', creatorList);
	})

});


/***** VIEW ALL GENRES PAGE (genres) - Contains ability to SELECT Genres *****/
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


/***** CUSTOMER SEARCH RESULTS PAGE (customer) - Contains ability to SELECT from Customers, Creators, and Genres *****/
app.get('/customer', function(req, res) {

	var customerList = {};

	//for the name submitted, split it into the first and last name
	var name_arr = req.query.full_name.split(" ");

	//if the full name was empty, set fname and lname to an empty string
	if(req.query.full_name = '') {
		var fname = "";
		var lname = "";
	}
	else if(name_arr.length == 1) {
		var fname = name_arr[0];
		var lname = "";
	}
	//otherwise, set the first and last name
	else {
		var fname = name_arr[0];
		var lname = name_arr[1];
	}

	//search for a customer that has a name like the one submitted
	var query = "SELECT customer_ID, first_name, last_name, email, phone, debt, favorite_creator, favorite_genre FROM Customers WHERE first_name LIKE ? AND last_name LIKE ?";
	var inserts = ["%" + fname + "%", "%" + lname + "%"];

	mysql.pool.query(query, inserts, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		customerList.customer = results;

		//get all of the creators
		var subquery = "SELECT * FROM Creators";
		//console.log(customerList.customer[0].favorite_creator);

		mysql.pool.query(subquery, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			//add favorite creator
			customerList = addFavoriteCreators(customerList, results);

			//get all of the genres
			var subsubquery = "SELECT * FROM Genres";

			mysql.pool.query(subsubquery, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}
				customerList = addFavoriteGenres(customerList, results);
				//console.log(customerList);

				res.render('customer', customerList);
			});
		});
	});
});


function renderSearchedGames(req, res, gameList, page) {
	//Takes a list of games that were searched and adds the genres and creators
	//to the JSON file before rendering the page

	//for every game in the list of games, add a Genres string and a Creators string
	for(var i = 0; i < gameList.game.length; i++) {
		gameList.game[i].genres = "";
		gameList.game[i].creators = "";
	}

	//next, get all of the game genres attached to board_games (with the names)
	var query2 = "SELECT Game_Genres.genre_ID, Game_Genres.board_game_ID, Genres.genre_name FROM Game_Genres INNER JOIN Genres ON Game_Genres.genre_ID = Genres.genre_ID";

	mysql.pool.query(query2, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		gameList = addGenres(gameList, results);


		//next, get all of the creators attached to board games (with the names)
		var query3 = "SELECT Game_Creators.creator_ID, Game_Creators.board_game_ID, Creators.first_name, Creators.last_name FROM Game_Creators INNER JOIN Creators ON Game_Creators.creator_ID = Creators.creator_ID"

		mysql.pool.query(query3, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			gameList = addCreators(gameList, results);
			//console.log(gameList);

			res.render(page, gameList);
		});
	});

}

/***** GAME SEARCH RESULTS PAGE (boardgame) - Contains ability to SELECT from Board_Games, Creators, Game_Genres, Game_Creators, and Genres *****/
app.get('/boardgame', function(req, res) {

	var gameList = {};
	//console.log(req.query.gameInfo, req.query.filterBy);

	if(req.query.filterBy == "name") {

		var query = "SELECT * FROM Board_Games WHERE game_name LIKE ?";
		var inserts = ["%" + req.query.gameInfo + "%"];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			gameList.game = results;
			//console.log(gameList);

			renderSearchedGames(req, res, gameList, 'boardgame');
		});

	}

	else if(req.query.filterBy == "genre") {

		var query = "SELECT * FROM Board_Games INNER JOIN Game_Genres ON Game_Genres.board_game_ID = Board_Games.board_game_ID WHERE Game_Genres.genre_ID = (SELECT genre_ID FROM Genres WHERE genre_name LIKE ?)";
		var inserts = ["%" + req.query.gameInfo + "%"];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			gameList.game = results;
			//console.log(gameList);

			renderSearchedGames(req, res, gameList, 'boardgame');
		});
	}

	else if(req.query.filterBy == "creator") {
		var query = "SELECT * FROM Board_Games INNER JOIN Game_Creators ON Game_Creators.board_game_ID = Board_Games.board_game_ID WHERE Game_Creators.creator_ID = (SELECT creator_ID FROM Creators WHERE first_name LIKE ?)";
		var inserts = ["%" + req.query.gameInfo + "%"]

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			gameList.game = results;
			//console.log(gameList);

			renderSearchedGames(req, res, gameList, 'boardgame');
		});
	}

});


//rent-a-game
app.get('/rent-a-game', function(req, res) {
	res.render('rent-a-game');
});



function addGames(rentalList, gameList) {
	/*
	Takes two JSONs, one with a list of rentals and the other, games, and 
	adds all of the games with the same board_game_ID as the rental list
	to the list of rentals.
	Returns the rentalList.
	*/

	rentalList.game = [];

	//iterate through the list of rentals
	for(var i = 0; i < rentalList.rental.length; i++) {

		//iterate through the list of games
		for(var j = 0; j < gameList.length; j++) {

			//if the board_game_ids are the same, add it to rentalList
			if(rentalList.rental[i].board_game_ID == gameList[j].board_game_ID) {
				rentalList.game[i] = gameList[j];
			}
		}

	}

	//return rentalList, now with games
	return rentalList;
}

function addRentalInfo(rentalList) {
	/*
	Takes a JSON with a list of rentals and games, and adds the rental info to the 
	games list.
	Returns the rentalList.
	*/

	//for each game and rental in the list (which should be the same length)
	for(var i = 0; i < rentalList.rental.length; i++) {

		//add the due date to the game list
		rentalList.game[i].due_date = rentalList.rental[i].due_date.getUTCMonth() + "/" + rentalList.rental[i].due_date.getUTCDate() + "/" + rentalList.rental[i].due_date.getUTCFullYear();
		//add the rental id to the game list
		rentalList.game[i].rental_ID = rentalList.rental[i].rental_ID;
		//add the customer id to the game list
		rentalList.game[i].customer_ID = rentalList.rental[i].customer_ID;
	}

	//return the rentalList
	return rentalList;
}

/***** CUSTOMER RENTALS PAGE - Renders the rentals for the current customer *****/
app.get('/customer-rentals', function(req, res) {

	var rentalList = {};

	//get all of the rentals for the specified customer
	var query = "SELECT * FROM Rentals WHERE customer_ID = ? AND returned = 0";
	var inserts = [req.query.customer_ID];
	//console.log(req.query.customer_ID);

	mysql.pool.query(query, inserts, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}
		rentalList.rental = results;

		//get all of the boardgames attached to these rentals
		var subquery = "SELECT * FROM Board_Games";

		mysql.pool.query(subquery, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}

			rentalList = addGames(rentalList, results);
			rentalList = addRentalInfo(rentalList, results);

			//console.log(rentalList);
			//render the page
			renderSearchedGames(req, res, rentalList, 'customer-rentals');
		});
	});
});

//return the rentals in the customer's list of rentals (UPDATE Rentals)
app.post('/customer-rentals', function(req, res) {

	//first, UPDATE rentals to mark the rental in Rentals as returned
	var query = "UPDATE Rentals SET returned = 1 WHERE rental_ID = ?";
	var inserts = [req.body.rental_ID];

	mysql.pool.query(query, inserts, function(error, results, fields) {
		if(error) {
			res.write(JSON.stringify(error));
			res.end();
		}

		//now, display the customer's remaining rentals
		var rentalList = {};

		//get all of the rentals for the specified customer
		var query = "SELECT * FROM Rentals WHERE customer_ID = ? AND returned = 0";
		var inserts = [req.body.customer_ID];

		mysql.pool.query(query, inserts, function(error, results, fields) {
			if(error) {
				res.write(JSON.stringify(error));
				res.end();
			}
			rentalList.rental = results;

			//get all of the boardgames attached to these rentals
			var subquery = "SELECT * FROM Board_Games";

			mysql.pool.query(subquery, function(error, results, fields) {
				if(error) {
					res.write(JSON.stringify(error));
					res.end();
				}

				rentalList = addGames(rentalList, results);
				rentalList = addRentalInfo(rentalList, results);
				//console.log(rentalList);

				//render the page
				renderSearchedGames(req, res, rentalList, 'customer-rentals');
			});
		});

	});
});



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