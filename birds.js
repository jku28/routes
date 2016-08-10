var express = require('express');
var router = express.Router();

/* GET birdlist
 *
 */
router.get('/birdlist', function(req, res) {
	var db = req.db;
	var collection = db.get('birdlist');
	collection.find({},{},function(e,docs) {
		res.json(docs);
	});
});

/* GET birdlist by a user
 *
 */
router.get('/birdlist/:id', function(req, res) {
	var db = req.db;
	var id = req.params.id;
	var collection = db.get('birdlist');
	collection.find({ 'owner' : id },{},function(e,docs) {
		res.json(docs);
	});
});

/* POST birdlist
 *
 */
router.post('/addbird', function(req,res) {
	var db = req.db;
	var collection = db.get('birdlist');
	collection.insert(req.body, function(err, result) {
		res.send(
			(err === null) ? { msg: ''} : { msg: err} 
		);
	});
});

/* 
 * DELETE to delete bird
 */
 router.delete('/deletebird/:id', function(req,res) {
 	var db = req.db;
 	var collection = db.get('birdlist');
 	var birdToDelete = req.params.id;
 	collection.remove({ '_id' : birdToDelete }, function(err) {
 		res.send((err === null) ? { msg: ''} : { msg:'error: ' + err });
 	});
 });

 
/* UPDATE bird
 *
 */
router.get('/updatebird/:birdId/:vote/:userId', function(req,res) {
	var db = req.db;
	var collection = db.get('birdlist');
	var bird = req.params.birdId;
	var user = req.params.userId;
	var vote = (req.params.vote).toString().toLowerCase();
	var voteArray = [];
	// var birdToUpdate;
	var exists = false;
	
	var getBird = function ( callback ) {
		collection.find({ '_id' : bird }, function(e,docs) {

			voteArray = docs[0].votes;
			callback(voteArray);
		});
	}

	var addVotes = function (voteList) {
		console.log('votelist before loop: ' + voteList);

		var i=0;
		while (!exists && i<voteList.length) {
			if (voteList[i][0] == vote) {
				voteList[i][1] += 1;
				exists = true;
			}
			else { 
				i++; 
			}
		}

		if (!exists) {
			voteList.push([vote,1]);
		}	

		console.log('votelist after loop: ' + voteList);
		
		// Replace votes property with new voteList
		collection.update({ _id : bird }, { $set: { 'votes' : voteList}}, function(err, result){
				res.send(
					(err === null) ? { msg: 'Update Success' } : { msg: 'bloop' }
				);
		});
		
		// Add user to seenbyuser list
		collection.update({ _id : bird }, { $push: { 'seenbyuser' : user }});
	}

	getBird(addVotes);
});

/* GET random bird
 *
 */
router.get('/randomBird/:id', function(req,res) {
	var db = req.db;
	var collection = db.get('birdlist');
	var user = req.params.id;
	// Create weighted array of bird votes, count total votes
	var birdWeightedList =[];
	var totalVotes = 0;
	var maxWeight = 50;
	var counter = 0;

	var getSightings = function ( callback ) {
		collection.find({ 'status' : 'unverified', 'seenbyuser' : {$ne : user} }, function(e,docs){

			console.log(docs)

			// Loops through unverified sightings and performs 4 functions
			// 1) Get total votes for all unverified sightings
			// 2) Track maxWeight; Weight = 50-votes/totalVotes; Sighting with lowest votes = greatest weight
			// 3) Add _id and weight into birdWeightedList array 
			//    birdWeightedList array is used for fitness proportionate selection  
			for (var i=0; i<docs.length; i++) {
				for (var j=0; j<docs[i].votes.length; j++){
					var votes = 0;
					votes += docs[i].votes[j][1];
					totalVotes += docs[i].votes[j][1];
				}

				if (maxWeight<votes) {
				maxWeight = votes;
				}

				birdWeightedList[counter] = [];
				birdWeightedList[counter][0] = docs[i]._id;
				birdWeightedList[counter++][1] = 50-votes;
			}
			callback (birdWeightedList);
		});
	}
	
	var pickRandomSighting = function (weightedList) {
		var randomBirdId;
		var notAccepted = true;
		var index;

		while (notAccepted){
			index = Math.round((weightedList.length-1)*Math.random());
			if (Math.random()<(weightedList[index][1]/maxWeight)) {
				randomBirdId = weightedList[index][0];
				notAccepted=false;
			}
			else { return; }
		}

		collection.find({'_id' : randomBirdId},function(e,docs) {
		res.json(docs);
		});
	}

	getSightings( pickRandomSighting );

});


module.exports = router;
