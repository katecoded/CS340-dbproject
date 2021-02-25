# CS340-dbproject

Otherworldly Games is a board game library on an alien planet. Aliens across the galaxy come here to fulfill their quest for fun board games with their intergalactic buddies. This database represents the information the library needs in order to run its business, including checking out games as well as keeping track of the creators of the games, the genres, and details about the games in order to obtain the right game for their needs. It is also necessary to keep track of the rentals of the games to make sure that a game is not rented when it is unavailable. Customers can rent as many board games as they would like, but there is only one copy of each. Otherworldly Games has 100 games available to borrow for their 150 customers. Their 15 employees and 2 owners access the information daily in order to facilitate rentals - rentals are only done in person.


**Notes for Use**

- dbcon.js must be updated with actual username and password in order to function


**If using on flip servers, here is how to make handlebars play nice:**

First, rollback handlebars version like so: npm install -save express-handlebars@4.0.4

Then, follow this tutorial to fix an error in the express-handlebars.js file:

https://www.youtube.com/watch?v=sw6rcXZiRos&feature=youtu.be&t=1441
