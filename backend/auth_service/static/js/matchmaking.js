


/*--------------------------------------------- PARTICULES ------------------------------------------------------------------*/
function random_rgba() {
	var o = Math.round, r = Math.random, s = 255;
	return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ')';
}

class Particle{
	constructor(x, y, size, velocity){
		this.x = x
		this.y = y
		this.size = size
		this.width = Math.random() * size
		this.height = Math.random() * size
		this.rad = Math.random() * 2
		this.rad = Math.random() * 2
		this.velocity = velocity
		this.alpha = 0.5
		this.friction = 0.99
		this.count = 0
		this.color = random_rgba()
	}

	//update classique des particules
	update(){
		this.velocity.x *= this.friction
		this.velocity.y *= this.friction
		this.x += this.velocity.x
		this.y += this.velocity.y
		this.alpha -= 0.01
	}

	//update des particules de victoire pour donner un effet confeti
	updateEndParticle(){
		if (this.count > Math.random() * 500){
			let temp = Math.random()
			this.velocity.y = Math.random() * 0.006
			this.velocity.x = Math.random() * ((temp - 0.5)/Math.abs(temp - 0.5)) * 0.002
			this.width = Math.random() * this.size
			this.height = Math.random() * this.size
			this.count = 0
		}
		this.x += this.velocity.x
		this.y += this.velocity.y
		this.count += 1
	}
}




/* ----------------------------------------------- PADDLE ------------------------------------------------------------- */
class Paddle{

	constructor(position){
		//stocker uniquement en pourcentage
		this.position = position
		this.height = 0.15
		this.width = 0.01
	}
}

/* ----------------------------------------------- BALL ------------------------------------------------------------- */
class Ball{
	constructor(){
		//stocker uniquement en pourcentage
		this.position = {x : 0.5, y : 0.5}
		this.velocity = {x : 0, y : 0}
		this.height = 0.01 / 0.6
		this.width = 0.01
		this.radius = 0.007
	}
}

/* ----------------------------------------------- GAME ------------------------------------------------------------- */

class Game{
	constructor(canvasName){
		// creation de la variable du canvas
		this.canvas = document.getElementById(canvasName);
		this.ctx = this.canvas.getContext("2d");
		// mise a l'echelle du canvas
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerWidth * 0.6;
		// creation des objets du jeu
		this.paddle1 = new Paddle({position : {x : 0.01, y : 0.45}})
		this.paddle2 = new Paddle({position : {x : 0.98, y : 0.45}})
		this.ball = new Ball()
		this.particles = []
		this.endParticles = []
		// comptage du score pour le scores particles
		this.ps1 = 0
		this.ps2 = 0
		this.pause = 0
		this.count = 10
		this.limit_score = 2
		this.countdown = 0
		this.host = 0
		this.font = "10vh Arial"
	}

	//gestion de la taille du canvas en redefinissant la classe css du canvas
	resizeCanvas(){
		//condition on est limite par la hauteur
		if (window.innerHeight - 300 < window.innerWidth * 0.6){
			this.canvas.width = (window.innerHeight - 300) / 0.6
			this.canvas.height = window.innerHeight - 300
			this.font = "10vh Arial"
			if (this.canvas.classList.value != 'resizecanvas'){
				this.canvas.classList.toggle('resizecanvas')
			}
		}
		//condition on est limite par la largeur
		if (window.innerHeight - 300 > window.innerWidth * 0.6){
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerWidth * 0.6
			this.font = "10vw Arial"
			if (this.canvas.classList.value == 'resizecanvas'){
				this.canvas.classList.toggle('resizecanvas')
			}
		}
	}

	// afficher les nouvelles position des paddles de la balle et des particules
	drawAll(){
		this.ctx.fillStyle = 'white'
		this.ctx.fillRect(this.paddle1.position.x * this.canvas.width, 
			this.paddle1.position.y * this.canvas.height, 
			this.paddle1.width * this.canvas.width, 
			this.paddle1.height * this.canvas.height)
		this.ctx.fillRect(this.paddle2.position.x * this.canvas.width, 
			this.paddle2.position.y * this.canvas.height, 
			this.paddle2.width * this.canvas.width, 
			this.paddle2.height * this.canvas.height)
		this.ctx.fillRect(this.ball.position.x * this.canvas.width, 
			this.ball.position.y * this.canvas.height, 
			this.ball.width * this.canvas.width, 
			this.ball.height * this.canvas.height)
		this.drawParticles()
	}

	drawAllv2() {
		this.ctx.save(); // Sauvegarde l'état du contexte actuel
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		// this.ctx.fillStyle = 'black';
		// this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.beginPath();
		this.ctx.fillStyle = 'white'
		this.ctx.fillRect(this.paddle1.position.x* this.canvas.width, this.paddle1.position.y * this.canvas.height, this.paddle1.width* this.canvas.width, this.paddle1.height * this.canvas.height);
		this.ctx.fillRect(this.paddle2.position.x* this.canvas.width, this.paddle2.position.y * this.canvas.height, this.paddle2.width* this.canvas.width, this.paddle2.height * this.canvas.height);
		
		// this.ctx.fillRect(this.ball.position.x, this.ball.position.y, this.ball.width, this.ball.height)
		this.ctx.arc(this.ball.position.x * this.canvas.width, this.ball.position.y * this.canvas.height, this.ball.radius* this.canvas.width, 0, Math.PI * 2);
		this.ctx.fill();
		// paddle1.draw();
		// paddle2.draw();
		// ball.draw();
		
		this.drawParticles()
		this.ctx.restore(); // Restaure l'état du contexte
	}

	// refresh le canvas
	fillBackground(){
		// this.ctx.fillStyle = 'black'
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
		this.ctx.fillRect(this.canvas.width*0.02, 0, this.canvas.width*0.96, this.canvas.height)
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.canvas.width*0.02, this.canvas.height)
		this.ctx.fillRect(this.canvas.width*0.98, 0, this.canvas.width*0.02, this.canvas.height)
	}

	// creation de particules quand la balle touche un paddle
	createCollisionParticles(data, size){
		let x = this.ball.position.x + this.ball.width/2
		let y = this.ball.position.y + this.ball.height/2
		for (let i = 0; i < 5; i++){
			this.particles.push(
				new Particle(x, y, size, {
					x: (Math.random() - 0.5) * (Math.random() * 0.003),
					y: (Math.random() - 0.5) * (Math.random() * 0.003)
				})
			)
		}
	}

	// creation de particules quand un jouer marque
	createScoreParticles(score1, score2, size){
		let x
		let temp
		if (score1 > this.ps1){
			temp = 1
			x = 0
		}
		else if (score2 > this.ps2){
			temp = -1
			x = 1
		}
		for (let i = 0; i < 50; i++){
			this.particles.push(
				new Particle(x, this.ball.position.y + this.ball.height/2, size, {
					x: Math.random() * temp * (Math.random() * 0.01),
					y: (Math.random() - 0.5) * (Math.random() * 0.005)
				})
			)
		}
		this.ps1 = score1
		this.ps2 = score2
	}

	//afficher une particule passee en parametre
	drawParticles(){
		this.particles.forEach((Particle, index) => {
			if (Particle.alpha <= 0){
				this.particles.splice(index, 1)
			}
			else {
				this.ctx.save()
				this.ctx.globalAlpha = Particle.alpha
				// this.ctx.fillStyle = 'white'
				this.ctx.beginPath()
				this.ctx.arc(Particle.x * this.canvas.width, 
					Particle.y * this.canvas.height, 
					Particle.width * this.canvas.width, 
					0, Math.PI * Particle.rad, false);
				this.ctx.strokestyle = 'white'
				this.ctx.stroke()
				this.ctx.fill();
				// this.ctx.fillRect(Particle.x  * this.canvas.width, 
				// 	Particle.y * this.canvas.height, 
				// 	Particle.width * this.canvas.width, 
				// 	Particle.height * this.canvas.height)
				this.ctx.restore()
				Particle.update()
			}
		})
	}

	//afficher les particules de victoire
	drawEndParticles(){
		this.endParticles.forEach((Particle, index) => {
			if (Particle.y > 1){
				this.endParticles.splice(index, 1)
			}
			else {
				this.ctx.save()
				this.ctx.globalAlpha = Particle.alpha
				this.ctx.fillStyle = Particle.color
				this.ctx.fillRect(Particle.x  * this.canvas.width, 
					Particle.y * this.canvas.height, 
					Particle.width * this.canvas.width, 
					Particle.height * this.canvas.height)
				this.ctx.restore()
				Particle.updateEndParticle()
			}
		})
	}

	// affichage de symbole pause pour le jeu local
	createPauseSign(){
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
		this.ctx.fillStyle = 'white';
		this.ctx.fillRect(0.46 * this.canvas.width, 0.45 * this.canvas.height, 0.02 * this.canvas.width, 0.1 * this.canvas.height);
		this.ctx.fillRect(0.52 * this.canvas.width, 0.45 * this.canvas.height, 0.02 * this.canvas.width, 0.1 * this.canvas.height);
		this.count = 0
	}
	
	// affichage de symbole play pour le jeu local
	createPlaySign(count){
		this.ctx.save()
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
		this.ctx.globalAlpha = 1 - (count / 10)
		var p1 = {x : 0.46 * this.canvas.width, y : 0.45 * this.canvas.height};
		var p2 = {x : 0.46 * this.canvas.width, y : 0.55 * this.canvas.height};
		var p3 = {x : 0.54 * this.canvas.width, y : 0.5 * this.canvas.height};
		this.ctx.beginPath();
		this.ctx.moveTo(p1.x, p1.y);
		this.ctx.lineTo(p2.x, p2.y);
		this.ctx.lineTo(p3.x, p3.y);
		this.ctx.closePath();
		this.ctx.fillStyle = 'white'
		this.ctx.fill();
		this.ctx.restore()
		this.count += 1
	}

	//decompte pour les version solo (3 2 1 start)
	createCountdown(){
		this.ctx.save()
		this.ctx.font = this.font
		this.ctx.fillStyle = 'black'
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
		this.ctx.fillStyle = 'white'
		if (this.countdown < 30){
			this.ctx.fillText("3",0.47 * this.canvas.width, 0.56 * this.canvas.height)
		}
		else if (this.countdown < 60){
			this.ctx.fillText("2",0.47 * this.canvas.width, 0.56 * this.canvas.height)
		}
		else if (this.countdown < 90){
			this.ctx.fillText("1",0.47 * this.canvas.width, 0.56 * this.canvas.height)
		}
		this.countdown += 1
		this.ctx.restore()
	}

	//creation des particules de victoire + texte de qui a gagne
	createLocalEndScreen(str, i){
		this.fillBackground()
		if (i < 400){
			this.createWinParticles()
		}
		this.drawEndParticles()
		document.getElementById("win_name").innerHTML = str
		document.getElementById('LittleVictory').style.display = "block"
		document.getElementById('LittleVictory').style.zIndex = "1000"
		document.getElementById("win_name").style.color = 'white'
	}

	//creation des particules de victoire
	createWinParticles(){
		for (let i = 0; i < 2; i++){
			this.endParticles.push(
				new Particle(Math.random(), 0, 0.02, {
					x: 0,
					y: (Math.random() * 0.004)
				})
			)
		}
	}
}

// declarer mon socket
let socket;
let socket_game = null;
let interval = null;
let userId;
let host;
let in_game = 0;
let socket_game_input = null;


window.addEventListener('popstate', function() {
	// Vérifiez si le joueur est en train de jouer
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.close();
	}
	if (in_game == 1) {
		console.log('popstate event triggered');
		if (interval)
		{
			clearInterval(interval)
			interval = null
		}
		socket_game.close();
		// socket_game_input.close();
		console.log('Le joueur a quitté la partie.');
		in_game = 0;
	}
	if (localsocket && localsocket.readyState === WebSocket.OPEN) {
		localsocket.close();
	}
	if (iasocket && iasocket.readyState === WebSocket.OPEN) {
		iasocket.close();
	}
});


/* ----------------------------------------------- MATCHMAKING ------------------------------------------------------------- */

// JOINQUEUE
const joinQueue = () => {
	document.getElementById("overlay").style.display = "block";
    document.getElementById("loading_icon").style.display = "block";
	socket = new WebSocket('wss://' + window.location.host + '/ws/queue/');
	socket.onopen = function(e) {
		pullIdFromBack().then(user_id => {
			console.log('WebSocket connection established.');
			socket.send(JSON.stringify({ action: 'join_queue', userId: user_id}));
			userId = user_id;
		})
	};

	socket.onclose = function(e) {
		console.log('QueueSocket connection closed');
	  };
	
	socket.onmessage = function(e) {
	  const data = JSON.parse(e.data);
	  console.log('response = ', data)
	  let action = data.action
	  let status = data.status

	  if (action == 'join_queue')
	  {
		if (status === 'success')
			console.log('success: ', data.message)
		else if (status === 'error')
			console.log('error joining queue: ', error)
	  }

	  else if (action == 'start_game')
	  {
		console.log('starting Game')
		quitQueue()
		launchGame(data)
	  }
	}
};

// QUITQUEUE
const quitQueue = () => {
	if (socket)
	{
		socket.send(JSON.stringify({ action: 'quit_queue', userId: socket.userId }));
		socket.close(1000);
		console.log('User left the queue');
	}
  };

// sleep
  function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchGameInvitation(gameId, userId_play) {
	console.log("gameId = ", gameId, " userId = ", userId_play);
	userId = userId_play;

	if (socket_game !== null || socket_game_input !== null) {
		console.log('Cannot launch game: WebSocket is already open');
		return;
	}
	socket_game_input = new WebSocket('wss://' + window.location.host + '/ws/game/pong/input/' + gameId + '/');
	socket_game = new WebSocket('wss://' + window.location.host + '/ws/game/pong/' + gameId + '/');
	socket_game.onopen = async function(e) {
		console.log('connected to gameSocket successfuly with id:', userId)
		console.log('gameId:', gameId)
		socket_game.send(JSON.stringify({ action: 'add_user_from_invitation', userId: userId, gameId: gameId}));
		updateURLAndHistory(`/game/pong/${gameId}`)
		await waitForCanvasAndStartGame();  // Await the canvas to be ready
		in_game = 1;
		console.log('starting GAMEEE from Tournament')
		await startGameOnline(socket_game, gameId);
	}
	socket_game.onclose = function(e) {
		socket_game = null;
		socket_game_input.close()
		socket_game_input = null;
		console.log('GAME WebSocket connection closed with code ');
	}
}

// LAUNCHGAME
const launchGame = (data) => {
	if (socket_game !== null || socket_game_input !== null) {
		console.log('Cannot launch game: WebSocket is already open');
		return;
	}
	socket_game_input = new WebSocket('wss://' + window.location.host + '/ws/game/pong/input/' + data.gameId + '/');
	socket_game = new WebSocket('wss://' + window.location.host + '/ws/game/pong/' + data.gameId + '/');
	socket_game.onopen = async function(e) {
		console.log('connected to gameSocket successfuly with id:', userId)
		console.log('gameId:', data.gameId)
		updateURLAndHistory(`/game/pong/${data.gameId}`)
		in_game = 1;
		await waitForCanvasAndStartGame();  // Await the canvas to be ready
		console.log('starting GAMEEE')
		socket_game.send(JSON.stringify({ action: 'add_player', userId: userId, gameId: data.gameId}));
		await startGameOnline(socket_game, data.gameId);
		// startGameOnline();
	}
	socket_game.onclose = function(e) {
		socket_game = null;
		socket_game_input.close()
		socket_game_input = null;
		console.log('GAME WebSocket connection closed with code ');
	}
}

const waitForCanvasAndStartGame = () => {
	return new Promise((resolve) => {
		const checkCanvas = () => {
			console.log('waiting for canvas !');
			const canvas = document.getElementById('pongCanvasOnline');
			if (canvas != null) {
				console.log('canvas is ready !');
				resolve(true);
			} else {
				requestAnimationFrame(checkCanvas);
			}
		};
		requestAnimationFrame(checkCanvas);
	});
}


/* ----------------------------------------------- GAME ONLINE ------------------------------------------------------------- */


async function startGameOnline(socket_game, gameId) {
	console.log("startGameOnline")
	console.log(socket_game)
	console.log(gameId)

	const game = new Game("pongCanvasOnline")
	game.resizeCanvas()
	// Utiliser un Set pour stocker les touches enfoncées
	const keysPressed = new Set();

	document.addEventListener("keydown", function(event) {
		if (in_game == 1) {
			keysPressed.add(event.code);
			keysPressed.add(event.code);
		}
	});

	document.addEventListener("keyup", function(event) {
		if (in_game == 1) {
			keysPressed.delete(event.code);
		}
	});

	addEventListener("resize", (event) => {
		game.resizeCanvas()
	});

	let lastSentDirection = '';

	function processInput() {
		let direction = '';
		if (keysPressed.has("ArrowUp")) {
			direction = 'up';
		} else if (keysPressed.has("ArrowDown")) {
			direction = 'down';
		}
		if (direction !== lastSentDirection) {
			lastSentDirection = direction;
			return direction
		}
		return direction
	}

	function animationbis(){
		if (game.countdown < 90)
			requestAnimationFrame(animationbis)
		game.createCountdown()
	}

	animationbis()

	let fps, fpsInterval, startTime, now, then, elapsed;
	let started = 0;
	console.log("started = ", started);

		let lastTime
		function startAnimating(fps) {
		console.log('starting animation');
		started = 1;
		fpsInterval = 1000 / fps;
		then = performance.now();
		startTime = then;
		lastTime = performance.now
		requestAnimationFrame(animate);
	}
	
	async function animate() {
		// console.log('LOOPING')
		if (in_game) {
			requestAnimationFrame(animate);
	
			// now = performance.now();
			// elapsed = now - then;
	
			// if (elapsed > fpsInterval) {
				// then = now - (elapsed % fpsInterval);
	
				// Process user input and send it to the server at a reduced rate
				direction = processInput();
				if (in_game) {
					socket_game_input.send(JSON.stringify({
						'action': 'update_paddles',
						'gameId': gameId,
						'userId': userId,
						'elapsed': elapsed,
						'direction': direction,
					}));
				}
				updateCanvas();
			// }
		}
	}

	// lastTime = performance.now()
	socket_game.onmessage = function (e) {
		const data = JSON.parse(e.data);
		if (data.action == 'update_game') {
			if (started == 0) startAnimating(60);
			game.createScoreParticles(data.score_p1, data.score_p2, 0.010)
			game.ball.position.x = data.ball_position.x;
			game.ball.position.y = data.ball_position.y;
			game.paddle2.position.x = data.right_bar_position.x;
			game.paddle2.position.y = data.right_bar_position.y;
			game.paddle1.position.x = data.left_bar_position.x;
			game.paddle1.position.y = data.left_bar_position.y;
			if (data.collision == 1){
				game.createCollisionParticles(data, 0.005)
			}
			updateScores(data.score_p1, data.score_p2, data.username_p1, data.username_p2, game)
		} else if (data.action == 'game_over') {
			console.log('redirecting ........... in game_over');
			in_game = 0;
			started = 0;
			updateURLAndHistory('/game/');
			socket_game.close();
		} else if (data.action == 'send_winner') {
			console.log("userId = ", userId, " winnerId = ", data.winnerId);
			console.log('gameId = ', gameId);
			in_game = 0;
			started = 0;
			socket_game.close();
			sendWinner(data, gameId, userId);
		}
	};

	function updateCanvas() {
		// ctx.save(); // Sauvegarde l'état du contexte actuel
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		// ctx.fillStyle = 'black';
		// ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// paddle1.draw();
		// paddle2.draw();
		// ball.draw();
		
		// ctx.restore(); // Restaure l'état du contexte
		game.fillBackground()
		game.drawAllv2()
	}

		
	socket_game.onerror = function (error) {
		console.log("WebSocket error");
	};
}

function updateScores(score1, score2, username_p1, username_p2, game) {
	const score1Element = document.getElementById('score1');
	const score2Element = document.getElementById('score2');

	score1Element.textContent = score2;
	score2Element.textContent = score1;
	game.ps1 = score1
	game.ps2 = score2
	document.getElementById('player1Name').innerHTML = username_p2;
	document.getElementById('player2Name').innerHTML = username_p1;

}








function startLocalGame() {
	console.log("startLocalGame()");
	window.history.pushState({}, "", `/game/pong/local/`);
	window.dispatchEvent(new PopStateEvent("popstate"));
    // loadGameView(userId);
	
}

let localsocket = null;
let localsocketInput = null;
var in_game_local = 0
function startGame() {

	//recuperer le userID depuis le html
	const userIlocal = document.getElementById('user_id').textContent;
	console.log("startGame()")
	console.log("userIlocal = ", userIlocal)

	//creer la classe game (toute la gestion du canvas a l'interieur)
	const game = new Game("pongCanvas")
	game.resizeCanvas()

	//cretion de la socket
	localsocket = new WebSocket('wss://' + window.location.host + '/ws/game/create_local_game/' + userIlocal + '/');
	localsocketInput = new WebSocket('wss://' + window.location.host + '/ws/game/create_local_game_input/' + userIlocal + '/');
	localsocket.onopen = async function(e) {
		console.log('connected to Local Consumer successfuly with id:', userIlocal)
		localsocket.send(JSON.stringify({ action: 'add_player', userId: userIlocal, gameId: userIlocal}));
		in_game_local = 1
	}

	// gestion de pause/play
	var count = 10;

	//variables locales de eventlistener
	const right_keysPressed = new Set();
	const left_keysPressed = new Set();
	var right_direction = ""
	var left_direction = ""

	// Ecouter les événements de clavier pour stocker les touches enfoncées
	document.addEventListener("keydown", function(event) {
		if (in_game_local && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			right_keysPressed.add(event.code)
		}
		if (in_game_local && (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S")) {
			left_keysPressed.add(event.code)
		}
	});

	document.addEventListener("keyup", function(event) {
		if (in_game_local && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			right_keysPressed.delete(event.code)
		}
		if (in_game_local && (event.key === "w" || event.key === "W" || event.key === "s" || event.key === "S")) {
			left_keysPressed.delete(event.code)
		}
	});

	function right_processInput() {
		right_direction = "";
		if (right_keysPressed.has("ArrowUp")) {
			right_direction = 'up';
		} else if (right_keysPressed.has("ArrowDown")) {
			right_direction = 'down';
		}
	}

	function left_processInput() {
		left_direction = "";
		if (left_keysPressed.has("KeyW")) {
			left_direction = 'up';
		}
		else if (left_keysPressed.has("KeyS")) {
			left_direction = 'down';
		}
	}

	//gestion de la taille du canvas de maniere responsive
	addEventListener("resize", (event) => {
		if (in_game_local){
			game.resizeCanvas()
		}
	});

	window.addEventListener('popstate', function() {
		// Vérifiez si le joueur est en train de jouer
		if (in_game_local)
			console.log('popstate event triggered');
			localsocket.close();
			console.log('Le joueur a quitté la partie.');
			in_game_local = 0;
	});


	function animationbis(){
		if (game.countdown < 90)
			requestAnimationFrame(animationbis)
		game.createCountdown()
	}

	animationbis()


	let fpsInterval, startTime, now, then, elapsed;
	let started = 0;
	let gameEnded = 0;
	var i = 0
	
	function startAnimating(fps) {
		// console.log(game.limit_score)
		// console.log('starting animation');
		started = 1;
		fpsInterval = 1000 / fps;
		then = performance.now();
		startTime = then;
		requestAnimationFrame(animate);
	}
	
	async function animate() {
		// console.log('LOOPING')
		if (in_game_local) {
			requestAnimationFrame(animate);
			
			now = performance.now();
			elapsed = now - then;

			right_processInput()
			left_processInput()
			
			if (elapsed > fpsInterval) {
				then = now - (elapsed % fpsInterval);
				
				if (!gameEnded && game.pause == 0 && localsocketInput.readyState === WebSocket.OPEN) {
					localsocketInput.send(JSON.stringify({
						'action': 'update_paddles',
						'userId' : userIlocal,
						'gameId' : userIlocal,
						'right_direction': right_direction, 
						'left_direction': left_direction,
					}));
				}
				// updateCanvas();
				// if (game.countdown < 90){
				// 	game.createCountdown()
				// 	return
				// }
				// if (game.pause == 1){
				// 	game.createPauseSign() //gestion de pause
				// }
				// else if (game.pause == 0 && game.count < 10){
				// 	game.createPlaySign(count) //gestion de play
				// }
				game.fillBackground() // effacer la frame precedente
				if (gameEnded == 0){
					game.drawAllv2() // afficher les nouvelles position des paddles de la balle et des particules
				}
				if (game.ps1 >= game.limit_score){
					game.createLocalEndScreen("PLAYER 1 WINS", i)
					gameEnded = 1
					i++
				}
				else if (game.ps2 >= game.limit_score){
					game.createLocalEndScreen("PLAYER 2 WINS", i)
					gameEnded = 1
					i++
				}
				if ((game.ps1 >= game.limit_score || game.ps2 >= game.limit_score) && game.endParticles.length === 0){
					in_game_local = 0
					updateURLAndHistory('/game/')
				}
			}
		}
	}

	// Gérer les erreurs de connexion WebSocket
	localsocket.onerror = function (error) {
		console.log("localsocket error");
	}

	localsocket.onclose = function () {
		console.log("localsocket close");
		localsocketInput.close()
	};

	localsocket.onmessage = function (e) {
		const data = JSON.parse(e.data);
		// console.log(data)
		//update le jeu
		if (data.action == 'update_game') {
			if (started == 0) startAnimating(60);
			game.paddle2.position.x = data.right_bar_position.x;
			game.paddle2.position.y = data.right_bar_position.y;
			game.paddle1.position.x = data.left_bar_position.x;
			game.paddle1.position.y = data.left_bar_position.y;
			if (data.collision == 1){
				game.createCollisionParticles(data, 0.005)
			}
			if (data.score == 1){
				game.createScoreParticles(data.score.p1, data.score.p2, 0.010)
			}
			game.ball.position.x = data.ball_position.x;
			game.ball.position.y = data.ball_position.y;
		}
		updateScores(data.score_p1, data.score_p2, data.username_p1, data.username_p2, game);
	};
}




// ! ------------------------------ vs IA --------------------------------



function startVSIAGame() {
	console.log("startVSIAGame()");
	window.history.pushState({}, "", `/game/pong/VSIA/`);
	window.dispatchEvent(new PopStateEvent("popstate"));
    // loadGameView(userId);
	
}

var iasocket = null;
var iasocketInput = null;
var in_game_vs_ia = 0;
function startIAGame() {

	//recuperer le userID depuis le html
	const userIdvsIA = document.getElementById('user_id').textContent;
	console.log("startIAGame()")
	console.log("userIdvsIA = ", userIdvsIA)

	//creer la classe game (toute la gestion du canvas a l'interieur)
	const game = new Game("pongCanvas")
	const userIlocal = document.getElementById('user_id').textContent;
	game.resizeCanvas()	

	//creation de la socket
	iasocket = new WebSocket('wss://' + window.location.host + '/ws/game/create_VSIA_game/' + userIdvsIA + '/');
	iasocketInput = new WebSocket('wss://' + window.location.host + '/ws/game/create_VSIA_game_input/' + userIlocal + '/');
	iasocket.onopen = async function(e) {
		console.log('connected to Local Consumer successfuly with id:', userIlocal)
		iasocket.send(JSON.stringify({ action: 'add_player', userId: userIlocal, gameId: userIlocal}));
		in_game_vs_ia = 1
	}

	// gestion de pause/play
	var count = 10;

	//variables locales de eventlistener
	const VSIA_keysPressed = new Set();
	var right_direction = ""
	var left_direction = ""

	// Ecouter les événements de clavier pour stocker les touches enfoncées
	document.addEventListener("keydown", function(event) {
		if (in_game_vs_ia && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			VSIA_keysPressed.add(event.code)
		}
	});

	document.addEventListener("keyup", function(event) {
		if (in_game_vs_ia && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
			VSIA_keysPressed.delete(event.code)
		}
	});

	function right_processInput() {
		right_direction = "";
		if (VSIA_keysPressed.has("ArrowUp")) {
			right_direction = 'up';
		} else if (VSIA_keysPressed.has("ArrowDown")) {
			right_direction = 'down';
		}
	}

	//gestion de la taille du canvas de maniere responsive
	addEventListener("resize", (event) => {
		if (in_game_vs_ia){
			game.resizeCanvas()
		}
	});


	window.addEventListener('popstate', function() {
		// Vérifiez si le joueur est en train de jouer
		if (in_game_vs_ia)
			console.log('popstate event triggered');
			iasocket.close();
			console.log('Le joueur a quitté la partie.');
			in_game_vs_ia = 0;
	
	});

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	var temoin = []

	async function vaChercher(y){
		let hey = temoin.length + 1
		temoin.unshift(hey)
		let dp = 0.011/1.6
		let dt = 0.0102
		let dist = game.paddle1.position.y + game.paddle1.height / 2 - (y + game.ball.height / 2)
		let temp = Math.abs(dist) / (dp * 1 / dt)
		if (dist > 0){
			left_direction = "up"
		}
		else {
			left_direction = "down"
		}
		await sleep(temp * 1000)
		if (temoin.length <= hey)
			left_direction = ""
		temoin.pop()
	}

	function affiney(point, vect, x){
		return ((vect.y/vect.x)*(x - point.x) + point.y)
	}

	function affinex(point, vect, y){
		return ((vect.x/vect.y)*(y - point.y) + point.x)
	}

	function leftcollisionPos(point, vect){
		let colltop = affinex({x : point.x , y : point.y - game.ball.radius}, vect, 0)
		let collbot = affinex({x : point.x , y : point.y + game.ball.radius}, vect, 1)
		if (vect.y < 0 && colltop >= 0.02){
			vect.y *= -1
			point = {x : colltop, y : 0}
		}
		else if (vect.y > 0 && collbot >= 0.02){
			vect.y *= -1
			point = {x : collbot, y : 1}
		}
		return (affiney(point, vect, 0.02))
	}

	function rightcollisionPos(point, vect){
		let colltop = affinex({x : point.x , y : point.y - game.ball.radius}, vect, 0)
		let collbot = affinex({x : point.x , y : point.y + game.ball.radius}, vect, 1)
		if (vect.y < 0 && colltop <= 0.98){
			vect.y *= -1
			point = {x : colltop, y : 0}
		}
		else if (vect.y > 0 && collbot <= 0.98){
			vect.y *= -1
			point = {x : collbot, y : 1}
		}
		return (affiney({x : point.x, y : point.y + game.ball.width}, vect, 0.98))
	}

	var pos = {x : 0, y : 0}
	var velocity = {x : 0, y : 0}
	var collision = 0
	var setup = 0

	var scoreup = 0
	var witness = 0

	var gamestate = 0
	var IAup = 0

	async function terminator(){
		while (game.pause == 1){
			await sleep(50)
		}
		pos = {x : game.ball.position.x, y : game.ball.position.y}
		if (witness == 0 && game.ball.velocity.x < 0){
			// console.log('collision  = 1')
			collision = 1
		}
		else if (game.ball.velocity.x < 0 && Math.abs(game.ball.velocity.x - velocity.x) > 0.001){
			// console.log('collision  = 1 else if')
			collision = 1
		}
		else if (game.ball.velocity.x > 0 && Math.abs(game.ball.velocity.x - velocity.x) > 0.001 && 
		game.ball.position.x < 0.7){
			setup = 1
		}
		if (collision == 1){
			velocity = {x : game.ball.velocity.x, y : game.ball.velocity.y}
			// console.log('va chercher left')
			await vaChercher(leftcollisionPos(pos, velocity))
			collision = 0
		}
		if (setup == 1){
			velocity = {x : game.ball.velocity.x, y : game.ball.velocity.y}
			// console.log('va chercher right')
			await vaChercher(rightcollisionPos(pos, velocity))
			setup = 0
		}
		witness += 1
		velocity = {x : game.ball.velocity.x, y : game.ball.velocity.y}
		if (scoreup){
			scoreup = 0
			witness = 0
			IAup = 0
			pos = {x : 0, y : 0}
			velocity = {x : 0, y : 0}
		}
		else if (!gameEnded){
			// console.log('IA SETTIMEOUT TO 1000')
			interval = setTimeout(terminator, 1000)
		}
	}

	var i = 0

	function animationbis(){
		if (game.countdown < 90)
			requestAnimationFrame(animationbis)
		game.createCountdown()
	}

	animationbis()

	
	let fpsInterval, startTime, now, then, elapsed;
	let started = 0;
	let gameEnded = 0;
	var j = 0
	
	function drawIA(){
		
		// if (game.countdown < 90){
		// 	game.createCountdown()
		// 	return
		// }
		// if (game.pause == 1){
		// 	game.createPauseSign() //gestion de pause
		// }
		// else if (game.pause == 0 && game.count < 10){
		// 	game.createPlaySign(count) //gestion de play
		// }
		game.fillBackground() // effacer la frame precedente
		if (gameEnded == 0){
			game.drawAllv2() // afficher les nouvelles position des paddles de la balle et des particules
		}
		if (game.ps1 >= game.limit_score){
			game.createLocalEndScreen("YOU WIN", j)
			gameEnded = 1
			j++
		}
		else if (game.ps2 >= game.limit_score){
			game.createLocalEndScreen("YOU LOSE", j)
			gameEnded = 1
			j++
		}
		// else {
			// iasocket.send(JSON.stringify({ 'right_direction': right_direction, 
					// 'left_direction': left_direction, 'pause' : game.pause, 'restart' : 0, 'userID' : userIdvsIA}));
		// }
	}

	function startAnimating(fps) {
		console.log('starting animation');
		started = 1;
		fpsInterval = 1000 / fps;
		then = performance.now();
		startTime = then;
		requestAnimationFrame(animate);
	}
	
	
	
	
	async function animate() {
		// console.log('LOOPING')
		if (in_game_vs_ia) {
			requestAnimationFrame(animate);
			
			now = performance.now();
			elapsed = now - then;

			right_processInput()
			
			if (elapsed > fpsInterval) {
				then = now - (elapsed % fpsInterval);
				
				if (!gameEnded && game.pause == 0 && iasocketInput.readyState === WebSocket.OPEN) {
					iasocketInput.send(JSON.stringify({
						'action': 'update_paddles',
						'userId' : userIlocal,
						'gameId' : userIlocal,
						'right_direction': right_direction, 
						'left_direction': left_direction,
					}));
				}
				drawIA()
				if ((game.ps1 >= game.limit_score || game.ps2 >= game.limit_score) && game.endParticles.length === 0){
					in_game_vs_ia = 0
					updateURLAndHistory('/game/')
					// rediriger
				}
				if (in_game_vs_ia){
					if (IAup == 0 && gamestate == 1){
						console.log("IASTART")
						interval = setTimeout(terminator, 10)
						IAup = 1
					}
				}
			}
		}
	}

	// Gérer les erreurs de connexion WebSocket
	iasocket.onerror = function (error) {
		console.log("iasocket error");
	}

	iasocket.onclose = function () {
		console.log("iasocket close");
		iasocketInput.close();
		clearInterval(interval)
	};

	iasocket.onmessage = function (e) {
		const data = JSON.parse(e.data);

		//update des positions de paddle2
		if (data.action == 'update_game') {
			if (started == 0) startAnimating(60);
			game.paddle2.position.x = data.right_bar_position.x;
			game.paddle2.position.y = data.right_bar_position.y;
			game.paddle1.position.x = data.left_bar_position.x;
			game.paddle1.position.y = data.left_bar_position.y;
			if ('collision' in data) {
				if (data.collision == 1){
					game.createCollisionParticles(data, 0.005)
				}
			};
			if (data.score_p1 > game.ps1){
				game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
				scoreup = 1
				vaChercher(0.5);
			}
			if (data.score_p2 > game.ps2){
				game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
				scoreup = 1
				vaChercher(0.5);
			}
			game.createScoreParticles(data.score_p1, data.score_p2, 0.010)
			game.ball.velocity.x = data.ball_position.x - game.ball.position.x;
			game.ball.velocity.y = data.ball_position.y - game.ball.position.y;
			game.ball.position.x = data.ball_position.x;
			game.ball.position.y = data.ball_position.y;
			if (data.ball_position.x != 0.5 && data.ball_position.y != 0.5){
				gamestate = 1
			}
			else{
				gamestate = 0
			}
			updateScores(data.score_p1, data.score_p2, data.username_p1, "IA", game);
		}
	}
}
