//------------------------------------------------------------------------------------/
//------------------- Départ du serveur forum avec le routeur ------------------------/
//------------------------------------------------------------------------------------/
//-----------------------------///////---///--///////////-----------------------------/
//----------------------------///-------///------///----------------------------------/
//---------------------------///-////--///------///-----------------------------------/
//--------------------------///////---///////--///------------------------------------/
//------------------------------------------------------------------------------------/


console.log('---------------------------------------------mise en route du serveur pour le forum -----------------------------------------------------');


//------------------------------------------------------------------------------------/
//----------------------- Définition des modules requis ------------------------------/
//------------------------------------------------------------------------------------/
const 	express = require('express'),
		app = express(),
		bodyParser = require('body-parser'),
		urlencodedParser = bodyParser.urlencoded({ extended: false }),
		session = require('express-session'),
		db = require('./db.js'),
		ip = require("ip");
var user_connect = 0;

//------------------------------------------------------------------------------------/
//---------------- Définition d'un dossier public pour les annexes -------------------/
//------------------------------------------------------------------------------------/		
app.use(express.static('public'));

//------------------------------------------------------------------------------------/
//------------------- Définition des options de la session ---------------------------/
//------------------------------------------------------------------------------------/ 
 app.use(session({
	  	secret: '343ji43j4n3jn4jk3n',
	  	resave: false,
	  	saveUninitialized: true,
	   	cookie: {
	        secure: false
	    }
	}));

//------------------------------------------------------------------------------------/
//---------------------------- Début du routeur---------------------------------------/
//------------------------------------------------------------------------------------/
app

//------------------------------------------------------------------------------------/
//-------- Redirige vers la page principale en cas d'arriver avec url '/'-------------/
//------------------------------------------------------------------------------------/
	.get('/', function(req, res){
	/*!!!!!!!!!!!  Travailler sur la redirection en cas de statut 404 !!!!!!!!!!!!!!*/
    	res.redirect('/forum/index');
	})// EO /


//------------------------------------------------------------------------------------/
//----------------------- Page principale du forum -----------------------------------/
//------------------------------------------------------------------------------------/
	.get('/forum/index', function(req, res) {

		req.session.adr_ip = ip.address();
		req.session.sujet = false;
		req.session.user_connect = user_connect;

		db.topics(function(topics){			
			db.statistics(function(data){

				res.render('index.ejs',{topics : topics, session : req.session, statistics : data });
			
			});// EO statistics			
		});// EO db.sujets()
	})// EO /index


//------------------------------------------------------------------------------------/
//------------------------- Page d'affichage des articles ----------------------------/
//------------------------------------------------------------------------------------/
	.get('/forum/papers/:id', function(req, res) {

		req.session.adr_ip = ip.address();
		req.session.topic = req.params.id;
		req.session.user_connect = user_connect;

		db.papers( req.session.topic, function(papers){

			db.statistics(function(data){

				res.render('papers.ejs',{papers : papers, session : req.session, statistics : data});			
			});//EO statistics			
		});// EO db.article
	})// EO /article
	.get('/forum/index/:id/delete', db.product_delete);
//------------------------------------------------------------------------------------/
//-------------------- Page de récupération des infos utilisateur --------------------/
//------------------------------------------------------------------------------------/	
	app.get('/forum/report', function(req, res){
		req.session.adr_ip = ip.address();

		res.render('report.ejs', {session : req.session});
	})// EO /info


//------------------------------------------------------------------------------------/
//------------------------- Page d'inscription ---------------------------------------/
//------------------------------------------------------------------------------------/
	.get('/forum/signin', function(req, res ){
		req.session.adr_ip = ip.address();

		res.render('signin.ejs' ,{session : req.session});
	})// EO singin


//------------------------------------------------------------------------------------/
//-------- Traitement du formulaire d'authentification utilisateur -------------------/
//------------------------------------------------------------------------------------/
	.post('/forum/login',urlencodedParser, function(req, res){

		var email = req.body.email,
			password = req.body.password;

		db.authentication(email , password , function(data){
			if (data) {
				req.session.connection = true;
				req.session.email = email;
				req.session.username = data ;
				user_connect ++;
				console.log(user_connect + ' connecté sur le forum')
			} else{
				req.session.connection = false;
				req.session.errror = 'Adresse mail ou mot de passe incorrect';				
			}// EO if/else

			if(req.session.topic){
				res.redirect('/forum/papers/'+ req.session.topic);
			}else{
				res.redirect('/forum/index');
			}// EO if/else			
		});// EO db.authentication()
	})// EO login


//------------------------------------------------------------------------------------/
//--------------------- Traitement du lien de déconnexion ----------------------------/
//------------------------------------------------------------------------------------/
	.get('/forum/logout', function(req, res){

		req.session.connection = false;
		req.session.username = '';
		req.session.email = '';
		req.session.topic = false;
		user_connect -= 1;
		console.log(user_connect +' Utilisateur connectés sur le forum')
		res.redirect('/forum/index');
		


	})// EO logout


//------------------------------------------------------------------------------------/
//------------------- Traitement du formulaire d'inscription -------------------------/
//------------------------------------------------------------------------------------/
	.post('/forum/new_user',urlencodedParser, function(req, res){

			var new_user = {
				password : req.body.password,
				username : '',
				email : ''
				} ,
				vpassword = req.body.vpassword;				

			if (new_user.password === vpassword) {

				new_user.username = req.body.username;
				new_user.email = req.body.email;
				
				db.signin(new_user, function(err){

					if (err) {
						console.log(err);
						req.session.error = err;
						res.redirect('/forum/signin');
					} else{
						req.session.connection = true;
						req.session.username = new_user.username;
						req.session.email = new_user.email;
						res.redirect('/forum/index');
					}// EO if/else
				});// EO db.signin

			} else{
				req.session.error = 'verification du mot de pass incorect';
				res.redirect('/forum/signin');
			}// EO if/else
	})// EO /inscription


//------------------------------------------------------------------------------------/
//---------------- Traitement du formulaire de nouveau sujet -------------------------/
//------------------------------------------------------------------------------------/
	.post('/forum/add_topic',urlencodedParser,function(req, res){

		if (req.session.connection) {
			var data = {
					topic : req.body.title_topic,
					paper : req.body.title_paper,
					content : req.body.paper,
					author : req.session.username
				}
			db.new_topic(data, function(err){
				if (err) {
					req.session.error = err ;
					res.redirect('/forum/papers/'+ data.topic);
				}else{
					res.redirect('/forum/index');
				}// EO if/else

			})//EO new_topic()

		} else {
			req.session.error ='Veuillez vous connecter pour ouvrir un nouveau sujet';
			res.redirect('/forum/index');	
		}//EO if/else
	})//EO /forum/add_sujet


//------------------------------------------------------------------------------------/
//---------------- Traitement du formulaire de nouvelle article ----------------------/
//------------------------------------------------------------------------------------/
	.post('/forum/add_paper/:id',urlencodedParser,function(req, res){
		if (req.session.connection) {
			var data = {
					topic : req.params.id,
					paper : req.body.title,
					content : req.body.paper,
					author : req.session.username
				}

			db.new_paper(data, function(err){
				if (err) {
					req.session.error = err ;
					res.redirect('/forum/papers/'+ data.topic);
				}else{
					res.redirect('/forum/papers/'+ data.topic);
				}// EO if/else

			})// EO new_paper()

		} else {
			req.session.error ='Veuillez vous connecter pour ajouter un article';
			res.redirect('/forum/papers/'+  req.params.id);	
		}// EO if/else
	})// EO /add_paper


//------------------------------------------------------------------------------------/
//---------------- Traitement du formulaire de nouveau commentaire -------------------/
//------------------------------------------------------------------------------------/
	.post('/forum/comment/:id',urlencodedParser,function(req, res){
		
		if (req.session.connection) {
			var data ={
					paper : req.params.id,
					topic : req.session.topic,
					comment : req.body.content,
					author : req.session.username
				}

			db.new_comment(data, function(err){

				if (err) {
					req.session.error = err ;
					res.redirect('/forum/papers/'+ req.session.topic);
				}else{
					res.redirect('/forum/papers/'+ req.session.topic);
				}// EO if/else
			})// EO new_comment()
		}else {
			req.session.error ='Veuillez vous connecter pour ajouter un nouveau commentaire';
			res.redirect('/forum/papers/'+ req.session.sujet);
		}// EO if/else
	})// EO /comment


//------------------------------------------------------------------------------------/
//----- Traitement du formulaire de mise à jour de l'adresse email utilisateur -------/
//------------------------------------------------------------------------------------/
	.post('/forum/mail_update/',urlencodedParser,function(req, res){
		if (req.session.connection) {
		var data = {
			new_email : req.body.email,
			username : req.session.username
			}

			db.update_email(data, function(err){
				if (err) {
					req.session.error = err ;
					res.redirect('/forum/report');
				}else{
					req.session.email = req.body.email;
					res.redirect('/forum/report');
					}// EO if/else
			})// EO new_comment()			
		} else{
			req.session.error ='Vous n\47 êtes  connecter a aucun compte';
			res.redirect('/forum/report');
		}// EO if/else
	})// EO mail_update


//------------------------------------------------------------------------------------/
//----- Traitement du formulaire de mise a jour du mot de passe utilisateur ----------/
//------------------------------------------------------------------------------------/
	.post('/forum/password_update/',urlencodedParser,function(req, res){
		if (req.session.connection) {
			var new_password1 = req.body.password;
			var new_password2 = req.body.vpassword;

			console.log(new_password1);
			console.log(new_password2);

			if (new_password1 === new_password2) {

				var data = {
					new_password : new_password2 ,
					username : req.session.username
					}

				db.update_password(data, function(err){

					if (err) {
						req.session.error = err ;
						res.redirect('/forum/report');
					}else{
						req.session.error = 'Mot de passe correctement modifié' ;
						res.redirect('/forum/report');
					}// EO if/else
			})// EO new_comment()
			}else{

				   req.session.error = 'Les mots de passe tapé ne sont pas identiques';
					res.redirect('/forum/report');

			}// EO if/else
		} else{
			req.session.error ='Vous n\47 êtes  connecter a aucun compte';
			res.redirect('/forum/report');
		}// EO if/else
	})// EO uptdate password

;//EO routeur


//------------------------------------------------------------------------------------/
//------------- Mise en écoute du serveur sur le port '8080' -------------------------/
//------------------------------------------------------------------------------------/
app.listen(8080);