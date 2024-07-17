let socketdeleteTournament = null;
let socketLeaveTournament = null;
let socketTournament = null;
let socketCreateTournament = null;

async function deleteTournament () { 
	const tournament_name = document.getElementById('tournament_name').textContent;
	const userId = document.getElementById('user_id').textContent;

	if (socketdeleteTournament && socketdeleteTournament.readyState === WebSocket.OPEN) {
		// chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
		socketdeleteTournament.close();
	}
	if (!socketdeleteTournament || socketdeleteTournament.readyState !== WebSocket.OPEN) {

		socketdeleteTournament = new WebSocket('wss://' + window.location.host + '/ws/pong/lobby/' + tournament_name + '/');

		socketdeleteTournament.onopen = function(event) {
			console.log('socketdeleteTournament is open!');
			// console.log('userId = ', userId);
			// console.log('tournament_name = ', tournament_name);
			const data = {
				message: 'delete_tournament',
				tournament_name: tournament_name,
				userId: userId,
			};
			socketdeleteTournament.send(JSON.stringify(data));
		};

		socketdeleteTournament.onmessage = function(event) {
			// Assuming that the server sends a confirmation message when the delete operation is complete
			const data = JSON.parse(event.data);
			if (data.content === 'tournament_deleted') {
				console.log('tournament_deleted2');
				window.history.pushState({}, "", `/game/`);
				window.dispatchEvent(new PopStateEvent("popstate"));
				socketdeleteTournament.close();
				if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
					console.log("TEST1")
					socketLobbyCreator.close();
				}
			}
		};

		socketdeleteTournament.onclose = function(event) {
			console.log('socketdeleteTournament connection closed');
		};
	}
}

async function leaveTournament() { 
	const tournament_name = document.getElementById('tournament_name').textContent;
	const userId = document.getElementById('user_id').textContent;

	if (socketLeaveTournament && socketLeaveTournament.readyState === WebSocket.OPEN) {
		// chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
		socketLeaveTournament.close();
	}
	if (!socketLeaveTournament || socketLeaveTournament.readyState !== WebSocket.OPEN) {

		socketLeaveTournament = new WebSocket('wss://' + window.location.host + '/ws/pong/lobby/' + tournament_name + '/');

		socketLeaveTournament.onopen = function(event) {
			console.log('socketLeaveTournament is open!');
			const data = {
				message: 'leave_tournament',
				tournament_name: tournament_name,
				userId: userId,
			};
			socketLeaveTournament.send(JSON.stringify(data));
		};

		socketLeaveTournament.onmessage = function(event) {
			// Assuming that the server sends a confirmation message when the delete operation is complete
			const data = JSON.parse(event.data);
			if (data.content === 'leave_user') {
				window.history.pushState({}, "", `/game/`);
				window.dispatchEvent(new PopStateEvent("popstate"));
				socketLeaveTournament.close();
			}
		};

		socketLeaveTournament.onclose = function(event) {
			console.log('socketLeaveTournament connection closed');
		};
	}

}

function openModalTournament() {

	if (socketTournament && socketTournament.readyState === WebSocket.OPEN) {
		// chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
		socketTournament.close();
	}
	if (!socketTournament || socketTournament.readyState !== WebSocket.OPEN) {

		socketTournament = new WebSocket('wss://' + window.location.host + '/ws/create_tournament/');
		// const userId = document.getElementById('user_id').textContent;
		document.getElementById('ModalTournament').style.display = 'block';

		socketTournament.onopen = function(event) {
			console.log('socketTournament is open!');
			
			const data = {
				message: 'show_tournament',
			};
			
			// Envoyez les données lorsque la connexion WebSocket est ouverte
			socketTournament.send(JSON.stringify(data));
		};

		socketTournament.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log("data.content = ", data.content)
			if (data.tournaments) {
				var tournamentList = document.getElementById('tournamentList');
				if (tournamentList) {
					tournamentList.innerHTML = ''; // Effacer les anciens éléments de la liste
					data.tournaments.forEach(function(tournament) {
					if (!tournament.is_complete)
						{
							var button = document.createElement('button');
							button.textContent = tournament.name;
							button.classList.add('tournament-button'); // Ajouter une classe pour le style CSS si nécessaire
							button.addEventListener('click', function() {
								// Logique pour rejoindre le tournoi sélectionné
								joinTournament(socketTournament, tournament);
							});
							tournamentList.appendChild(button);
						}
					});
				}
			}
		};

		socketTournament.onclose = function(event) {
			console.log('socketTournament connection closed');
		};

		socketTournament.onerror = function(error) {
			console.error('socketTournament error observed:', error);
		};
	}
}

// Fonction pour rejoindre un tournoi
function joinTournament(socketTournament, tournament) {
	const userId = document.getElementById('user_id').textContent;
	const player_name_tour = document.getElementById('player_name_tour_join').value;
	const data = {
		message: 'join_tournament',
		userId: userId,
		tournament_name: tournament.name,
		player_name_tour: player_name_tour,
	};
	socketTournament.send(JSON.stringify(data));
	socketTournament.onmessage = async function(event) {
		var dataJSON = JSON.parse(event.data);
		// console.log('dataJSON.content = ', dataJSON.content)
		if (dataJSON.content === 'tournament_joined') {
			socketTournament.close();
			window.history.pushState({}, "", `/game/pong/lobby/${dataJSON.tournament_name}`);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
		else if (dataJSON.content === 'user_already_in_tournament') {
			const errorMessage = document.getElementById('error-message-join');
			errorMessage.innerHTML = await translate('You cannot join a tournament if you are already in another')
			errorMessage.style.display = 'block';
			// socketTournament.close();
		}
		else if (dataJSON.content === 'tournament_full') {
			const errorMessage = document.getElementById('error-message-join');
			errorMessage.innerHTML = "Le tournoi est deja plein"
			errorMessage.style.display = 'block';
			// socketTournament.close();
		}
		else if (dataJSON.content === 'wrong_name_name_tour') {
			const errorMessage = document.getElementById('error-message-join');
			errorMessage.innerHTML = "You cannot chose this name"
			errorMessage.style.display = 'block';
			// socketTournament.close();
		}
		else if (dataJSON.content === 'name_already_exists_name_tour') {
			const errorMessage = document.getElementById('error-message-join');
			errorMessage.innerHTML = "A user already have this name"
			errorMessage.style.display = 'block';
			// socketTournament.close();
		}
	}
}

async function joinYourTournament() {
	const userId = document.getElementById('user_id').textContent;
    try {
        const response = await fetch(`/user/${userId}/game/get_tournament_name`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // return data.lastMessage;
		window.history.pushState({}, "", `/game/pong/tournament/${data.tournament_name}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
	} catch (error) {
        console.error('Error :', error);
        fetchAlerts();
        return null;
    }
}

async function joinYourLobby() {
	const userId = document.getElementById('user_id').textContent;
    try {
        const response = await fetch(`/user/${userId}/game/get_tournament_name`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // return data.lastMessage;
		window.history.pushState({}, "", `/game/pong/lobby/${data.tournament_name}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
	} catch (error) {
        console.error('Error :', error);
        fetchAlerts();
        return null;
    }
}

function close1vs1() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('loading_icon').style.display = 'none';
}

function quitQueueAndCloseModal() {
    quitQueue();
    close1vs1();
}

function closeModalTournament() {
	socketTournament.close()
	document.getElementById('ModalTournament').style.display = 'none';
}

async function openModalCreateTournament() {
	console.log('openModalCreateTournament');
	document.getElementById('ModalCreateTournament').style.display = 'block';
	document.getElementById('game_name').setAttribute('placeholder', await translate('Name of tournament'));
}

function closeModalCreateTournament() {
	document.getElementById('ModalCreateTournament').style.display = 'none';
}


function fillPlayersInHTML(data) {
	const playerListContainer = document.getElementById('player-list');
	if (playerListContainer) {
		playerListContainer.innerHTML = '';  // Clear the list before updating

		data.participants.forEach(user => {
			const playerCard = document.createElement('div');
			playerCard.className = 'player-card';

			if (user.avatar) {
				const img = document.createElement('img');
                img.src = user.avatar;
				img.alt = "Avatar";
				img.className = 'avatar';
				playerCard.appendChild(img);
			} else {
				const avatar = document.createElement('div');
				avatar.className = 'avatar';
				avatar.style.backgroundImage = `url(${user.avatar})`;
				playerCard.appendChild(avatar);
			}

			const username = document.createElement('div');
			username.className = 'username';
			username.textContent = user.player_name_tour;

			playerCard.appendChild(username);

			playerListContainer.appendChild(playerCard);
		});
	}
}

function updateNbPlayers(dataLobby) {
    const tournamentNbPlayersDiv = document.getElementById('tournament-nb-players');
	if (tournamentNbPlayersDiv) {
		tournamentNbPlayersDiv.textContent = `Number of players: ${dataLobby.tournament_nb_player_direct} on ${dataLobby.tournament_nb_player} players`;
	}
}

function createTournament() {

	if (socketCreateTournament && socketCreateTournament.readyState === WebSocket.OPEN) {
		// chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
		socketCreateTournament.close();
	}
	if (!socketCreateTournament || socketCreateTournament.readyState !== WebSocket.OPEN) {

		socketCreateTournament = new WebSocket('wss://' + window.location.host + '/ws/create_tournament/');
		const gameName = document.getElementById('game_name').value;
		const player_name_tour = document.getElementById('player_name_tour').value;
		// gameName.setAttribute('placeholder', 'Nom du Tournoi');
		const numPlayers = document.getElementById('num_players').value;
		const userId = document.getElementById('user_id').textContent;
		// console.log('Nom de la Partie:', gameName);
		// console.log('Nombre de Joueurs:', numPlayers);

		socketCreateTournament.onopen = function(event) {
			console.log('createTournament is open!');
			
			const data = {
				message: 'create_tournament',
				userId: userId,
				tournament_name: gameName,
				num_players: numPlayers,
				player_name_tour: player_name_tour,
			};
			
			// Envoyez les données lorsque la connexion WebSocket est ouverte
			socketCreateTournament.send(JSON.stringify(data));
		};

		socketCreateTournament.onmessage = async function(event) {
			var dataJSON = JSON.parse(event.data);
			// console.log("dataJSON.content = ", dataJSON.content)
			if (dataJSON.content === 'wrong_name') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('Unauthorized tournament names');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}
			else if (dataJSON.content === 'name_already_exists') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('This tournament name already exists');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}
			else if (dataJSON.content === 'creator_already_exists') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('You cannot create more than two tournaments at a time.');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}	
			else if (dataJSON.content === 'user_already_in_tournament') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('You cannot create a tournament if you are already in another');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}
			else if (dataJSON.content === 'wrong_name_name_tour') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('You cannot chose this name');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}
			else if (dataJSON.content === 'name_already_exists_name_tour') {
				const errorMessage = document.getElementById('error-message');
				errorMessage.innerHTML = await translate('A user already have this name');
				errorMessage.style.display = 'block';
				socketCreateTournament.close();
			}		
			else if (dataJSON.content === 'tournament_created') {
				socketCreateTournament.close();
				window.history.pushState({}, "", `/game/pong/lobby/${dataJSON.tournament_name}`);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
		}

		socketCreateTournament.onclose = function(event) {
			console.log('socketCreateTournament connection closed');
		};
	}
	// closeModalCreateTournament();
}

// window.addEventListener('popstate', function() {
// 	console.log('popstate event triggered');
// 	socket_game.close();
// });

// Fermer la modale si l'utilisateur clique en dehors du contenu de la modale
window.onclick = function(event) {
	if (event.target == document.getElementById('ModalCreateTournament')) {
		closeModalCreateTournament();
	}
	if (event.target == document.getElementById('ModalTournament')) {
		closeModalTournament();
	}
}