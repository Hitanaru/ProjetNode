//------------------------------------------------------------------------------------/
//------------------- Module d'accès aux donnée de la base forum ---------------------/
//------------------------------------------------------------------------------------/
//-----------------------------///////---///--///////////-----------------------------/
//----------------------------///-------///------///----------------------------------/
//---------------------------///-////--///------///-----------------------------------/
//--------------------------///////---///////--///------------------------------------/
//------------------------------------------------------------------------------------/


//------------------------------------------------------------------------------------/
//----------------------------- Appele du module mongoose ----------------------------/
//------------------------------------------------------------------------------------/
const mongoose = require('mongoose');


//------------------------------------------------------------------------------------/
//------------ Mise en place des modèles de la base de données -----------------------/
//------------------------------------------------------------------------------------/
const 	userSchema = new mongoose.Schema({
			username :  String,
			email : String,
			password : String		 	
			}),
		userModel = mongoose.model('users', userSchema),

		topicSchema = new mongoose.Schema({
			 	title : String,
			 	date : { type : Date, default : Date.now },			 	
				author :  String
			}),
		topicModel = mongoose.model('topics', topicSchema),

		paperSchema = new mongoose.Schema({
			  title : String,
			  content : String,
			  date : { type : Date, default : Date.now },			  			  
			  author :  String,
			  topic : String,	  

			  comment : [{
			  	content : String,
			  	author : String,
			  	date : { type : Date, default : Date.now }
			 	 }
			  ]
			}),
		paperModel = mongoose.model('papers', paperSchema)
;//EO mep modèles


//------------------------------------------------------------------------------------/
//--------------- Méthode de connexion à la base de données --------------------------/
//------------------------------------------------------------------------------------/
connect2Db = function(callBack){
	mongoose.connect('mongodb://localhost/forum',function(err, db) {
		if (err) {
		  	console.log(err);
		    console.log("Connexion à la base de données 'Forum' échoué");

		}else{
		    callBack();
		}// EO if/else
	});// EO mongoose.connect
};// EO connect2Db()


//------------------------------------------------------------------------------------/
//--------------- Méthode de déconnexion de la base de données -----------------------/
//------------------------------------------------------------------------------------/
disconnect2Db = function(){
	mongoose.connection.close(function (err){
		if (err) {
			 console.log(err);
			 console.log('Deconnexion échoué')
		}// EO if		
	});// EO mongoose.connection.close
};// EO disconnect2Db


//------------------------------------------------------------------------------------/
//------------------------ Méthode d'accès aux sujets --------------------------------/
//--------------------------retourne tous les sujets----------------------------------/
//------------------------------------------------------------------------------------/
topics = function(callBack){

	connect2Db( function(){
		topicModel.find(null, function (err, topics) {	
			if (err){
				console.log(err);

			}else{
				disconnect2Db();
				return callBack(topics);		
			}// EO if/else		
		});// EO sujetModel.find
	});// EO connect2Db()
};// EO exports.sujet
module.exports.topics = topics; 

//------------------------------------------------------------------------------------/
//------------------------ Méthode d'accès aux articles ------------------------------/
//------- Retourne les articles dont le titre du sujet est passé en paramètre --------/
//------------------------------------------------------------------------------------/
papers = function(data , callBack){

	connect2Db(function(){

			paperModel.find({topic : data},function(err, papers){

				if (err) {
					console.log(err);
				}else{					
					return callBack(papers);
				}// EO if/else
			});// EO find()

	});// EO connect2Db()
};// EO papers()
module.exports.papers = papers; 

//------------------------------------------------------------------------------------/
//------------------------ Méthode de supression des articles ------------------------/
//------------------------------------------------------------------------------------/

exports.product_delete = function (req, res) {
    topicModel.findByIdAndRemove(req.params.id, function (err) {
        if (err) return (err);
        res.redirect('/forum/index');
    })
};

//------------------------------------------------------------------------------------/
//----------------------- Méthode de récupération des statistiques -------------------/
//------------------------------------------------------------------------------------/
statistics = function(callBack){
	var statistics = {
			last_paper : '',
			nbT_topics : 0,
			nbT_papers : 0,
			nbT_users : 0,
			paper_more_comment : '',
			last_user : ''
		}
		var paper_ = {
			title :'',
			topic : '',
			nt_comment : ''
						}
		var nbC = 0;

	connect2Db(function(){
		userModel.find(null, function(err,users){
			if(users.length < 1){
				statistics.nbT_users = 0
			}else{
				user = users[users.length-1];
				statistics.last_user = user.username;
			}

			paperModel.find(null,function(err, papers){

				statistics.nbT_papers = papers.length;

				if(papers.length < 1){
					statistics.nbT_papers = 0;
				}
				else{
					statistics.last_paper = papers[papers.length-1];
				}

				for (var i = 0; i < papers.length; i++) {
					var paper = papers[i];
					var comment = paper.comment; 


					if (comment.length > nbC) {
						nbC = comment.length;
						paper_ = {
							title : paper.title,
							topic : paper.topic,
							nt_comment : comment.length
						}						

					}// EO if
				}// EO for

				topicModel.find(null, function (err, topics) {

					statistics.paper_more_comment  = paper_ ;
					statistics.nbT_topics = topics.length ;
					callBack(statistics);

				});// EO sujetModel
			});// EO articleModel
		});// EO userModel 
	});//EO connect2Db
}//EO statistics
module.exports.statistics = statistics;


//------------------------------------------------------------------------------------/
//----------------------- Méthode d'authentification ---------------------------------/
//------------------------------------------------------------------------------------/
authentication = function(email, password, callBack){

	connect2Db(function(){

		var username;
		userModel.find({email : email},function(err, users){

			if (users == '') { 
				console.log('Adresse mail inconnue') ;
				return callBack(false);

			} else {
				var user = users[0];

				if (password === user.password){

				console.log(user.username + ' vient de se connecté');
				username = user.username;
				callBack(username);

				}else {

				console.log('Mot de passe incorrect');
				return callBack(false);

				}// EO if/else
			}// EO if/else
		});// EO find()
	})// EO connect2Db()
};// EO authentication()
module.exports.authentication = authentication; 


//------------------------------------------------------------------------------------/
//---------------- Méthode d'inscription sur la base de données ----------------------/
//------------------------------------------------------------------------------------/
signin = function(new_user, callBack){
	connect2Db(function(){


		userModel.find({'username' : new_user.username},function(err, users){
			if (users == '') {

				userModel.find({'email' : new_user.email},function(err, users){

					if (users == '') {

						var user = new userModel();

						user.username = new_user.username;
						user.email = new_user.email;
						user.password = new_user.password;
						user.save(function (err) {
							if (err) { 
								throw err; 
							}else{
								return callBack(false);
								disconnect2Db();
							}//EO if/else
						});//EO user.save
					}else{
						return callBack('Cette adresse mail est déjà utilisée');
						disconnect2Db();
					}//EO if/else
				})//EO query.exec()

			} else {
				return callBack('Ce pseudo est déjà utilisé');
				disconnect2Db();
			}// EO if/else
		});// EO find()
	});// EO connect2Db()
};// EO export.signin()
module.exports.signin = signin; 


//------------------------------------------------------------------------------------/
//---------------------- Méthode d’ajouts de nouveau sujets --------------------------/
//------------------------------------------------------------------------------------/
new_topic = function(data , callBack){
	connect2Db(function(){

		topicModel.find({title : data.topic},function(err, topics){
			console.log(topics);
			if (topics == '') {
				var topic = new topicModel();
				topic.title = data.topic;
				topic.author = data.author;

				topic.save(function(err){
					if (err) {
						return callBack('Erreur de sauvegarde');
						disconnect2Db();
					}else{
						new_paper(data , function(err){
							if (err) {
								return callBack(err);
							}else{
								return callBack(false);
							}// EO if/else
						});// EO new_paper
					}// EO if/else
				});// EO sujet save
			}else{
				return callBack('Se sujet a déjà été ouvert');
			}// EO if/else
		});// EO find
	});// EO connect2Db()
};// EO new_topic()
module.exports.new_topic = new_topic;


//------------------------------------------------------------------------------------/
//------------------ Méthode d'ajouts de nouveaux articles ---------------------------/
//------------------------------------------------------------------------------------/
new_paper = function(data, callBack){

	connect2Db(function(){

		paperModel.find({title : data.paper, topic : data.topic},function(err, papers){
			if (err) {
				console.log(err);
			}else{
				if (papers == '') {

					var paper = new paperModel();
					paper.title = data.paper;
					paper.topic = data.topic;
					paper.author = data.author;
					paper.content = data.content;

					paper.save(function(err){
						if (err) {
							return callBack(err);
						}else{
							return callBack(false);
						}// EO if/else
					})// EO article.save
				}else{
					return callBack('Ce titre d \47 article est déjà utilisé dans ce sujet ');
				}
			}// EO if/else
		})// EO if/else
	});// EO connect2Db()
}// EO new_paper()
module.exports.new_paper = new_paper;


//------------------------------------------------------------------------------------/
//------------------ Méthode d'ajout d'un nouveau commentaire ------------------------/
//------------------------------------------------------------------------------------/
new_comment = function(data, callBack){

	connect2Db(function(){

		paperModel.find({title : data.paper, topic : data.topic},function(err, papers){
			if (err) {
				console.log(err);
				return callBack(err);
			}else{
				var new_comment =  {
					content : data.comment,
					author : data.author
					},

					paper = papers[0],
					comment = [];

				comment = paper.comment;
				comment.push(new_comment);

				paperModel.update({title : data.paper, topic : data.topic}, { comment : comment }, { multi : true }, function (err) {
				 		if (err) { 
				 			return callBack(err);
				 		}else{
							return callBack(false);
				 		}
				});// EO update
			}// EO if/else
		}); // EO find()
	});// EO connect2Db()
}// EO new_comment
module.exports.new_comment = new_comment;


//------------------------------------------------------------------------------------/
//------------------ Méthode de mise a jour de l'email utilisateur -------------------/
//------------------------------------------------------------------------------------/
update_email = function(data, callBack){

	connect2Db(function(){
		userModel.find({email : datat.new_email},function(err, users){
			if (users == '') {
				userModel.update({ username : data.username}, { email : data.new_email }, { multi : true }, function (err) {
	 				if (err) { 
	 					return callBack(err);
	 				}else{
	 					return callBack(false);
	 				}// EO if/else
				});// EO update
			}else{
				return callBack('Cette adresse mail est déjà utilisée');
			}
		});// EO find
	});// EO connect
}// EO user_update
module.exports.update_email = update_email;


//------------------------------------------------------------------------------------/
//--------------- Méthode de mise a jour du mot de passe utilisateur -----------------/
//------------------------------------------------------------------------------------/
update_password = function(data, callBack){

	connect2Db(function(){
		userModel.update({ username : data.username}, { password : data.new_password }, { multi : true }, function (err) {
	 		if (err) { 
	 			return callBack(err);
	 		}else{
	 			return callBack(false);
	 		}//EO if/else
		});//EO update
	});//EO connect2Db
}//EO user_update
module.exports.update_password = update_password;