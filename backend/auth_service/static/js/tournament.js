let socketMatch = null;
// let socketTournament = null;
let socketMakeGroup = null;
let chatSocketTournament = null;
let socketTournamentReady = null;
let socketWaiting = null;
let socketWinner = null;
let socketShowTournament = null;
/**************************************************TOURNAMENT**************************************************/

//LISTE DES JOUEURS ET DE LEURS ADVERSAIRE
////////////////////////////////////////////////////////////////////////////////////////////////////
// let currentRound = 1;
// let totalRounds = 1; // Pour un tournoi de 16 joueurs, il y aura 4 rounds en tout
// let nb_player_tmp = 0;
// let matches = null;

function generateMatches(round, nb_player, matches, totalRounds) {
    const matchesContainer = document.getElementById('matches-container');
    if (matchesContainer) { matchesContainer.innerHTML = ''; }

    let numMatches = 0;
    for (let i = 1; i <= round; i++) {
        numMatches += Math.floor(nb_player / Math.pow(2, i));
    }

    for (let i = 0; i < numMatches; i++) {
        if (matches[i] && matches[i].nb_round + 1 === round) {
			console.log("matches[i] = ", matches[i])
            const match = document.createElement('li');
            match.classList.add('match');
            const player1 = matches[i].player1.player_name_tour;
            const player2 = matches[i].player2.player_name_tour;

            if (matches[i].winner !== null) {
                let score1, score2, player1Class, player2Class;
                if (matches[i].player1.user_id === matches[i].winner.user_id) {
                    score1 = matches[i].score_winner;
                    score2 = matches[i].score_loser;
                    player1Class = 'winner';
                    player2Class = 'loser';
                } else {
                    score1 = matches[i].score_loser;
                    score2 = matches[i].score_winner;
                    player1Class = 'loser';
                    player2Class = 'winner';
                }
                match.innerHTML = `
                    <div class="player-left ${player1Class}">${player1}</div>
                    <div class="versus">${score1} vs ${score2}</div>
                    <div class="player-right ${player2Class}">${player2}</div>
                `;
            } else {
                match.innerHTML = `
                    <div class="player-left">${player1}</div>
                    <div class="versus">vs</div>
                    <div class="player-right">${player2}</div>
                `;
            }
            matchesContainer.appendChild(match);
        }
    }
}


function LaunchGenerateMatches(testArrow, currentRound)
{
	if (socketShowTournament && socketShowTournament.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketShowTournament.close();
	}
	if (!socketShowTournament || socketShowTournament.readyState !== WebSocket.OPEN) {

		socketShowTournament = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/`);
		socketShowTournament.onopen = function(event) {
			console.log('socketShowTournament is open!');
			socketShowTournament.send(JSON.stringify({message : 'get_all_matches', tournament_name: tournament_name, userId: userId}));
		};
		socketShowTournament.onmessage = async function(event) {
			var data = JSON.parse(event.data);
			if (data.content === 'success') {
				let round_number = 0;
				console.log("data.finish = ", data.finish)
				if (data.finish) {
					round_number = data.tournament_round_number;
				} else {
					round_number = data.tournament_round_number + 1;
				}
                let nb_player  = data.tournament_nb_player;
                let totalRounds = Math.log2(nb_player);
				if (testArrow === 0) {
					document.getElementById('round-text').textContent = await translate('ROUND') + ` ${round_number}`;
                	currentRound = round_number;
				}
				console.log("totalRounds = ", totalRounds)
				console.log("round_number = ", round_number)
				console.log("currentRound = ", currentRound)
				if (currentRound > 1) {
					document.getElementById('prev-arrow').classList.remove('hidden');
				}
				if (currentRound < round_number) {
					document.getElementById('next-arrow').classList.remove('hidden');					
				}
				else {
					document.getElementById('next-arrow').classList.add('hidden');
				}
				console.log("data.matches = ", data.matches)
				generateMatches(currentRound, nb_player, data.matches, totalRounds);
				// socketShowTournament.close();
				if (data.logout_other && data.winner_id.toString() === userId) {
					waitingPayers(userId);
				}
			}
		}
		socketShowTournament.onclose = function(event) {
			console.log('socketShowTournament connection closed');
		};
		socketShowTournament.onerror = function (error) {
			console.error("socketShowTournament error:", error);
		};
    }
}

async function nextRound() {
	let currentRoundstr = document.getElementById('round-text').textContent
	let currentRound = parseInt(currentRoundstr.split("ROUND ")[1].trim(), 10)
	// if (currentRound < totalRounds) {
		currentRound++;
		document.getElementById('round-text').textContent = await translate('ROUND') + ` ${currentRound}`;
		LaunchGenerateMatches(1, currentRound);
		// generateMatches(currentRound);
		document.getElementById('prev-arrow').classList.remove('hidden');
		// if (currentRound === totalRounds) {
		// 	document.getElementById('next-arrow').classList.add('hidden');
		// }
	// }
}

async function previousRound() {
	let currentRoundstr = document.getElementById('round-text').textContent
	let currentRound = parseInt(currentRoundstr.split("ROUND ")[1].trim(), 10)
	console.log(currentRound)
	// if (currentRound > 1) {
		currentRound--;
		document.getElementById('round-text').textContent = await translate('ROUND') + ` ${currentRound}`;
		LaunchGenerateMatches(1, currentRound);
		// generateMatches(currentRound);
		document.getElementById('next-arrow').classList.remove('hidden');
		if (currentRound === 1) {
			document.getElementById('prev-arrow').classList.add('hidden');
		}
	// }
}

async function launchTournament(userId, tournament_name, bool_make_group) {
	console.log("launchTournament !!!!!")

	if (socketTournament && socketTournament.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketTournament.close();
	}
	if (!socketTournament || socketTournament.readyState !== WebSocket.OPEN) {

		socketTournament = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/`);
		socketTournament.onopen = function(event) {
			console.log('socketTournament is open!');
			socketTournament.send(JSON.stringify({message : 'make_matches', tournament_name: tournament_name, userId: userId}));
		};
		socketTournament.onmessage = function(event) {
			var data = JSON.parse(event.data);

			if (data.content === 'success') {
				// console.log("data.survivor_id = ", data.survivor_id);
				if (data.survivor_id && userId.toString() === data.survivor_id.toString()) {
					console.log("CREATTTTING GROUP")
					sendToGroup(bool_make_group);
				}
				if (data.user_id === userId) {
					socketTournament.close();
				}
			}
		}
		socketTournament.onclose = function(event) {
			console.log('socketTournament connection closed');
		};
		socketTournament.onerror = function (error) {
			console.error("socketTournament error:", error);
		};

		async function sendToGroup(bool_make_group) {
			if (bool_make_group) {
				if (socketMakeGroup && socketMakeGroup.readyState === WebSocket.OPEN) {
					// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
					socketMakeGroup.close();
				}
				if (!socketMakeGroup || socketMakeGroup.readyState !== WebSocket.OPEN) {
					socketMakeGroup = new WebSocket('wss://' + window.location.host + '/ws/get_group/');
					socketMakeGroup.onopen = function(event) {
						console.log('socketMakeGroup is open!');
						const data = { message: 'make_group_tournament', name: tournament_name, groupName: tournament_name};
						socketMakeGroup.send(JSON.stringify(data));
					};

					socketMakeGroup.onmessage = function(event) {
						var data = JSON.parse(event.data);
						if (data.content === "Get_Group") {
							socketMakeGroup.close();
						}
					}; 
					
					socketMakeGroup.onclose = function(event) {
						console.log('socketMakeGroup connection closed');
					};

					socketMakeGroup.onerror = function(error) {
						console.error('socketMakeGroup error observed:', error);
					};    
				}             
			}
			if (chatSocketTournament && chatSocketTournament.readyState === WebSocket.OPEN) {
				// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
				chatSocketTournament.close();
			}
			if (!chatSocketTournament || chatSocketTournament.readyState !== WebSocket.OPEN) {
				chatSocketTournament = new WebSocket('wss://' + window.location.host + '/ws/chat/' + tournament_name + '/');
				chatSocketTournament.onopen = function(event) {
					console.log('chatSocketTournament is open!');
					const dataToSend = {
						'content': "bot_message",
						'message': "",
					};		
					chatSocketTournament.send(JSON.stringify(dataToSend));
				};
				chatSocketTournament.onmessage = function(event) {
					chatSocketTournament.close();
				}; 
				chatSocketTournament.onclose = function(e) {
					console.log('chatSocketTournament closed');
				};
			}
		}
	}

}

async function readyToPlay() {
	// let match_id;
	if (socketTournamentReady && socketTournamentReady.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketTournamentReady.close();
	}
	if (!socketTournamentReady || socketTournamentReady.readyState !== WebSocket.OPEN) {
		socketTournamentReady = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/`);
		socketTournamentReady.onopen = function(event) {
			console.log('socketTournamentReady for ready is open!');
			socketTournamentReady.send(JSON.stringify({message : 'get_match_id', tournament_name: tournament_name, userId: userId}));
		};
		socketTournamentReady.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log("data.content = ", data.content)
			console.log("userId = ", userId, " data.match_id = ", data.match_id)
			// match_id = data.match_id;
			if (data.content === 'success') {
				socketTournamentReady.close();
				LaunchMatches(data.match_id)
			}
		}
		socketTournamentReady.onclose = function(event) {
			console.log('socketTournamentReady connection closed');
		};
		socketTournamentReady.onerror = function (error) {
			console.error("socketTournamentReady error:", error);
		};
	}
}

async function launchGameTournament(gameId, userId) {
	if (socket_game !== null || socket_game_input !== null) {
		console.error('Cannot launch game: WebSocket is already open');
		return;
	}
	socket_game_input = new WebSocket('wss://' + window.location.host + '/ws/game/pong/input/' + gameId + '/');
	socket_game = new WebSocket('wss://' + window.location.host + '/ws/game/pong/' + gameId + '/');
	socket_game.onopen = async function(e) {
		console.log('connected to gameSocket successfuly with id:', userId)
		console.log('gameId:', gameId)
		socket_game.send(JSON.stringify({ action: 'add_tournament_player', userId: userId, gameId: gameId}));
		updateURLAndHistory(`/game/pong/${gameId}`)
		await waitForCanvasAndStartGame();
		in_game = 1;
		console.log('starting GAMEEE')
		await startGameOnline(socket_game, gameId);
		// startGameOnline();
	}
	socket_game.onclose = function(e) {
		socket_game = null;
		socket_game_input.close()
		socket_game_input = null;
		console.error('GAME WebSocket connection closed with code ', e.code);
	}
}

function sendReadyState() {
	if (readyButton.textContent === "Ready" || readyButton.textContent === "Listo" || readyButton.textContent === "Prêt") {
		socketMatch.send(JSON.stringify({message: 'player_state', userId: userId, player_state: "Ready", tournament_name: tournament_name}));
		// readyButton.textContent = "Not Ready";
	} else {
		socketMatch.send(JSON.stringify({message: 'player_state', userId: userId, player_state: "Not_Ready", tournament_name: tournament_name}));
		// readyButton.textContent = "Ready";
	}
}

async function LaunchMatches(match_id) {
	let readyButton = document.getElementById("readyButton");
	const userId = document.getElementById('user_id').textContent;

	if (socketMatch && socketMatch.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketMatch.close();
	}
	if (!socketMatch || socketMatch.readyState !== WebSocket.OPEN) {
		socketMatch = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/${match_id}/`);
		socketMatch.onopen = function(event) {
			console.log('socketMatch is open!');
			sendReadyState();
		};

		socketMatch.onmessage = async function(event) {
			var data = JSON.parse(event.data);
			console.log("data.content = ", data.content)
			if (data.content === "Two_Players_Ready") {
				if (socketShowTournament && socketShowTournament.readyState === WebSocket.OPEN) {
					// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
					socketShowTournament.close();
				}
				launchGameTournament(data.match_id, userId)
				socketMatch.close();
			}
			else if (data.content === "Ready_Impossible") {
				readyButton.innerText = await translate('Ready');
			}
			else if (data.content === "Ready_alone") {
				console.log("data.last_state = ", data.last_state)
				if (data.last_state === "Ready") {
					readyButton.innerText = await translate('Not Ready');
				}
				else if (data.last_state === "Not_Ready") {
					readyButton.innerText = await translate('Ready');
				}
			}
		}
		socketMatch.onclose = async function(event) {
			console.log('socketMatch connection closed');
		};
		socketMatch.onerror = function (error) {
			console.error("socketMatch error:", error);
		};
	}
}

async function waitingPayers(userId) {
	console.log("waitingPayers()")

	if (socketWaiting && socketWaiting.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketWaiting.close();
	}
	if (!socketWaiting || socketWaiting.readyState !== WebSocket.OPEN) {	
		socketWaiting = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/`);
		socketWaiting.onopen = function(event) {
			console.log('socketWaiting is open!');
			socketWaiting.send(JSON.stringify({message : 'update_tournament', tournament_name: tournament_name, userId: userId}));
		};
		socketWaiting.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log("data.content = ", data.content)
			// console.log("userId = ", userId, " data.match_id = ", data.match_id)
			// match_id = data.match_id;
			if (data.content === 'new_round') {
				window.history.pushState({}, "", `/game/pong/tournament/${tournament_name}`);
				window.dispatchEvent(new PopStateEvent("popstate"));
				socketWaiting.close();
				launchTournament(userId, tournament_name, false);
			}
			else if (data.content === 'BIG_WIN') {
				console.log("WIIIIIIIIIIIIIIIIIIIIIIIINNNNNNNNNNNNNN")
				// window.history.pushState({}, "", `/user/`);
				// window.dispatchEvent(new PopStateEvent("popstate"));
				// openModalGagnant()
				setTimeout(openModalGagnant, 30);
				socketWaiting.close();
			}

		}
		socketWaiting.onclose = function(event) {
			console.log('socketWaiting connection closed');
		};
		socketWaiting.onerror = function (error) {
			console.error("socketWaiting error:", error);
		};
	}
}

async function openModalGagnant() {
    // Afficher la modale
    document.getElementById('ModalGagnant').style.display = 'block';
    document.getElementById('ModalGagnant').classList.add('show'); // Pour appliquer les styles Bootstrap de la modale
    document.body.classList.add('modal-open'); // Pour désactiver le défilement en arrière-plan

    // Ajouter la classe pour flouter l'arrière-plan
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show blur-backdrop';
    document.body.appendChild(backdrop);

    // Modifier le bouton "Ready"
    const readyButton = document.getElementById('readyButton');
    readyButton.innerHTML = await translate('Back to Menu');
    readyButton.onclick = function() {
        window.history.pushState({}, "", `/user/`);
        window.dispatchEvent(new PopStateEvent("popstate"));
    };
	CreateCanvas();
}

// Fermer la modale et retirer le flou de l'arrière-plan
function closeModalGagnant() {
    document.getElementById('ModalGagnant').style.display = 'none';
    document.getElementById('ModalGagnant').classList.remove('show'); // Pour enlever les styles Bootstrap de la modale
    document.body.classList.remove('modal-open'); // Pour réactiver le défilement en arrière-plan

    // Retirer la classe pour flouter l'arrière-plan
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.parentNode.removeChild(backdrop);
    }
}


async function sendWinner(data_game, match_id, userId) {

	if (socketWinner && socketWinner.readyState === WebSocket.OPEN) {
		// chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
		socketWinner.close();
	}
	if (!socketWinner || socketWinner.readyState !== WebSocket.OPEN) {	
	// const userId = document.getElementById('user_id').textContent;
		socketWinner = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/${match_id}/`);
		socketWinner.onopen = function(event) {
			console.log('socketWinner is open!');
			console.log("userId = ", userId, " score_p1 = ", data_game.score_p1);
			if (userId === data_game.winnerId) {
				console.log('match_id = ', match_id);
				socketWinner.send(JSON.stringify({message: 'winner',
					userId: userId,
					winner: data_game.winnerId,
					match_id: match_id,
					tournament_name: tournament_name,
					score_p1: data_game.score_p1,
					score_p2: data_game.score_p2,
				}));
			}
			else {
				socketWinner.send(JSON.stringify({message: 'loser', userId: userId, tournament_name: tournament_name, match_id: match_id}));
				window.history.pushState({}, "", `/user/`);
				window.dispatchEvent(new PopStateEvent("popstate"));
				fetchAlerts("You loose :(")
			}
		};
		socketWinner.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log("data.content = ", data.content)
			if (data.content === "success") {
				window.history.pushState({}, "", `/game/pong/tournament/${tournament_name}`);
				window.dispatchEvent(new PopStateEvent("popstate"));
				waitingPayers(userId);
				socketWinner.close();
			}
			else if (data.content === "success_loser") {
				socketWinner.close();
			}
		}
		socketWinner.onclose = function(event) {
			console.log('socketWinner connection closed');
		};
		socketWinner.onerror = function (error) {
			console.error("socketWinner error:", error);
		};
	}
}

window.onclick = function(event) {
	if (event.target == document.getElementById('ModalGagnant')) {
		closeModalGagnant();
	}
}











function CreateCanvas() {
	let W = window.innerWidth / 2; // Largeur de la fenêtre
	let H = window.innerHeight / 2; // Hauteur de la fenêtre
	const canvas = document.getElementById("canvasGagnant"); // Récupère l'élément canvas par son ID
	const context = canvas.getContext("2d"); // Obtient le contexte 2D du canvas pour dessiner
	const maxConfettis = 40; // Nombre maximum de confettis
	const particles = []; // Tableau pour stocker les particules de confettis

	const possibleColors = [
		"DodgerBlue", "OliveDrab", "Gold", "Pink", "SlateBlue", 
		"LightBlue", "Gold", "Violet", "PaleGreen", "SteelBlue", 
		"SandyBrown", "Chocolate", "Crimson"
	]; // Couleurs possibles pour les confettis

	// Définir les coordonnées et la taille du carré
	const rect = {
		x: 0, // Position x du coin supérieur gauche du carré
		y: 0, // Position y du coin supérieur gauche du carré
		width: W, // Largeur du carré
		height: H, // Hauteur du carré
		radius: 20 // Rayon des coins arrondis
	};

	function randomFromTo(from, to) {
		return Math.floor(Math.random() * (to - from + 1) + from); // Génère un nombre aléatoire entre from et to
	}

	function confettiParticle() {
		// Initialiser les coordonnées pour qu'elles soient juste au-dessus du carré
		this.x = Math.random() * rect.width + rect.x; // Position x aléatoire à l'intérieur du carré
		this.y = Math.random() * rect.y - rect.y; // Position y initial juste au-dessus du carré
		this.r = randomFromTo(11, 33); // Rayon aléatoire
		this.d = Math.random() * maxConfettis + 11; // Densité aléatoire
		this.color = possibleColors[Math.floor(Math.random() * possibleColors.length)]; // Couleur aléatoire
		this.tilt = Math.floor(Math.random() * 33) - 11; // Inclinaison aléatoire
		this.tiltAngleIncremental = Math.random() * 0.07 + 0.05; // Incrémentation de l'angle d'inclinaison
		this.tiltAngle = 0; // Angle d'inclinaison initial

		this.draw = function() {
			context.beginPath(); // Commence un nouveau chemin de dessin
			context.lineWidth = this.r / 2; // Définit l'épaisseur de la ligne
			context.strokeStyle = this.color; // Définit la couleur de la ligne
			context.moveTo(this.x + this.tilt + this.r / 3, this.y); // Déplace le crayon
			context.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 5); // Trace une ligne
			return context.stroke(); // Dessine la ligne
		};
	}

	function drawRoundedRect(ctx, x, y, width, height, radius) {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	function Draw() {
		const results = [];
	
		requestAnimationFrame(Draw); // Appelle Draw de manière récursive pour l'animation
	
		context.clearRect(0, 0, W, H); // Efface le canvas
	
		// Appliquer une ombre au rectangle
		context.shadowColor = "rgba(0, 0, 0, 0.5)"; // Couleur de l'ombre
		context.shadowBlur = 20; // Niveau de flou de l'ombre
		context.shadowOffsetX = 0; // Décalage horizontal de l'ombre
		context.shadowOffsetY = 0; // Décalage vertical de l'ombre
	
		let rectWidth = W * 0.7; // Exemple : 70% de la largeur de la fenêtre
		let rectHeight = H * 0.5; // Exemple : 50% de la hauteur de la fenêtre
	
		// Dessiner le rectangle blanc avec des coins arrondis
		let rectX = (W - rectWidth) / 2; // Calcul de la position x du rectangle
		let rectY = (H - rectHeight) / 2; // Calcul de la position y du rectangle
		context.fillStyle = "white"; // Couleur de remplissage du rectangle
		context.strokeStyle = "white"; // Couleur de la bordure (invisible ici)
		drawRoundedRect(context, rectX, rectY, rectWidth, rectHeight, rect.radius);
	
		// Réinitialiser l'ombre pour les autres dessins
		context.shadowColor = "transparent";
	
		context.save(); // Sauvegarde l'état actuel du contexte
		context.beginPath(); // Commence un nouveau chemin de dessin
		context.rect(rectX, rectY, rectWidth, rectHeight); // Définir une région de découpe correspondant au rectangle
		context.clip(); // Appliquer la découpe
	
		for (var i = 0; i < maxConfettis; i++) {
			results.push(particles[i].draw()); // Dessine chaque confetti
		}
	
		context.restore(); // Restaurer l'état du contexte pour annuler la découpe
	
		// Dessiner le texte au milieu du canvas
		context.fillStyle = "black"; // Couleur du texte
		context.font = "24px Arial"; // Police et taille du texte
		context.textAlign = "center"; // Alignement du texte au centre
		context.textBaseline = "middle"; // Alignement vertical au milieu
		context.fillText("Congratulations", W / 2, H / 2 - 10);
		context.font = "18px Arial"; // Police et taille du texte
		context.fillText("You are the big winner of the tournament", W / 2, H / 2 + 20);
	
		let particle = {};
		for (var i = 0; i < maxConfettis; i++) {
			particle = particles[i];
	
			particle.tiltAngle += particle.tiltAngleIncremental; // Incrémente l'angle d'inclinaison
			particle.y += (Math.cos(particle.d) + 1 + particle.r / 4) / 4; // Change la position y pour simuler la chute des confettis
			particle.tilt = Math.sin(particle.tiltAngle - i / 3) * 15; // Change l'inclinaison
	
			// Confinement aux bords du rectangle
			if (particle.x > rectX + rectWidth) {
				particle.x = rectX + rectWidth; // Empêche les confettis de sortir à droite
				particle.tilt = -particle.tilt; // Inverse l'inclinaison
			} else if (particle.x < rectX) {
				particle.x = rectX; // Empêche les confettis de sortir à gauche
				particle.tilt = -particle.tilt; // Inverse l'inclinaison
			}
	
			// Réinitialiser les confettis lorsqu'ils sortent du bas du rectangle
			if (particle.y > rectY + rectHeight) {
				particle.x = Math.random() * rectWidth + rectX; // Réinitialise x à une position aléatoire
				particle.y = Math.random() * rectY - rectY; // Réinitialise y juste au-dessus du sommet du rectangle
				particle.tilt = Math.floor(Math.random() * 10) - 20; // Réinitialise l'inclinaison
			}
		}
		return results;
	}
	
	

	window.addEventListener("resize", function() {
		W = window.innerWidth / 2; // Met à jour la largeur de la fenêtre
		H = window.innerHeight / 2; // Met à jour la hauteur de la fenêtre
		canvas.width = window.innerWidth / 2; // Ajuste la largeur du canvas
		canvas.height = window.innerHeight / 2; // Ajuste la hauteur du canvas
	},false);

	// Ajouter de nouveaux objets confetti à `particles[]`
	for (var i = 0; i < maxConfettis; i++) {
		particles.push(new confettiParticle()); // Ajoute une nouvelle particule de confetti
	}

	// Initialiser
	canvas.width = W; // Définit la largeur du canvas
	canvas.height = H; // Définit la hauteur du canvas
	Draw(); // Démarre l'animation
}
