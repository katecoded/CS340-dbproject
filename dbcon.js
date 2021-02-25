/*
Otherworldly Games

A project by Group 28: Fellowship of Databases

Team Members:
Nancy Nguyen
Katelyn Lindsey

dbcon.js
*/

var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit: 10,
	host: 'classmysql.engr.oregonstate.edu', 
	user: 'cs340_username',
	password: 'password',
	database: 'cs340_username'
});
module.exports.pool = pool;