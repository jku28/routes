var express = require('express');
var router = express.Router();

/* GET login - return true || false
 *
 */

router.get('/login/:username/:password', function(req,res) {
	var db = req.db;
	var collection = db.get('userlist');
	var username = req.params.username;
	var password = req.params.password;
	var usernameExists = false;

	collection.find({ 'username' : username },function(e,docs) {

		// If docs return empty => username does not exist; return false
		if (docs[0] !== undefined){
			// If url password = password on file; return true
			if (docs[0].password === password) {
				res.send(true);
			}
			// If url password != password on file; return false 
			else { res.send(false); }
		} 
		// Return false if password does not match
		else { res.send(false); }

	});
});

/* GET change user password
 *
 */

router.get('/changepassword/:id/:password', function(req,res) {
	var db = req.db;
	var collection = db.get('userlist');
	var userId = req.params.id;
	var newPassword = req.params.password;
	console.log('username : ' + userId);
	console.log('password : ' + newPassword);

	collection.update({ '_id' : userId }, { $set: { 'password' : newPassword}}, function(err, result){
		res.send(
			(err === null) ? { msg: '' } : { msg: err }
		);
	});
});


/* GET userlist
 *
 */
router.get('/userlist', function(req, res) {
	var db = req.db;
	var collection = db.get('userlist');
	collection.find({},{},function(e,docs) {
		res.json(docs);
	});
});

/* POST userlist
 *
 */
router.post('/adduser', function(req,res) {
	var db = req.db;
	var collection = db.get('userlist');
	collection.insert(req.body, function(err, result) {
		res.send(
			(err === null) ? { msg: ''} : { msg: err} 
		);
	});
});

/* 
 * DELETE to delete user
 */
 router.delete('/deleteuser/:id', function(req,res) {
 	var db = req.db;
 	var collection = db.get('userlist');
 	var userToDelete = req.params.id;
 	collection.remove({ '_id' : userToDelete }, function(err) {
 		res.send((err === null) ? { msg: ''} : { msg:'error: ' + err });
 	});
 });

module.exports = router;
