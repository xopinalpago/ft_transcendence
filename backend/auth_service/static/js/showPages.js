async function showHomepage() {
    try {
        const response = await fetch('/get_env/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        client_id = data.client_id;
        ip = data.ip;
    } catch (error) {
        fetchAlerts();
        return;
    }

    document.getElementById("app").innerHTML = `
    <div class="d-flex justify-content-center align-items-center flex-column" style="height: 100vh;">
    <h1 class="text-center" style="font-size: 6em; padding-bottom: 1em;">Transcendence</h1>
    <div class="container">
    <div class="row justify-content-center mb-3">
    <div class="col-md-12 text-center">
    <a class="btn btn-success" href="https://api.intra.42.fr/oauth/authorize?client_id=` + client_id + `&redirect_uri=https%3A%2F%2F` + ip + `%3A8000%2Foauth42%2F&response_type=code" style="width: 20em;">42</a>
    </div>
    </div>
    <div class="row justify-content-center mb-3">
    <div class="col-md-12 text-center">
    <a class="btn btn-success" href="/signup/" style="width: 20em;">Signup</a>
    </div>
    </div>
    <div class="row justify-content-center">
    <div class="col-md-12 text-center">
    <a class="btn btn-success" href="/login/" style="width: 20em;">Login</a>
    </div>
    </div>
    </div>
    </div>
    `;
    preventLinks();
}

const show2FA = async () => {
    document.getElementById("2FA-Form").addEventListener('submit', async function(event) {
        event.preventDefault();
        try {
            const formData = new FormData(this);
            userId = window.location.pathname.split('/')[2];
            const response = await fetch('/verify2FA/' + userId + '/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (!logoutSocket || logoutSocket.readyState !== WebSocket.OPEN) {
                logoutSocket = new WebSocket('wss://' + window.location.host + '/ws/logoutConsumer/');
            }
            logoutSocket.onopen = function(event) {
                logoutSocket.send(JSON.stringify({'message': 'login'}));
            }
            logoutSocket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.message === 'login') {
                    logoutSocket.send(JSON.stringify({'message': 'delete_from_group'}));
                    document.cookie = 'sessionid=; Max-Age=0; path=/';
                    fetchAlerts('You logged in somewhere else. You have been disconnected.', 'success');
                    logoutSocket.close();
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
            }
            fetchAlerts('2FA validated successfully.', 'success');
            window.history.pushState({}, "", "/user/");
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            fetchAlerts('2FA could not be validated', 'danger');
        }
    });
}

function handleLoginResponse() {
    if (!logoutSocket || logoutSocket.readyState !== WebSocket.OPEN) {
        logoutSocket = new WebSocket('wss://' + window.location.host + '/ws/logoutConsumer/');
    }
    logoutSocket.onopen = function(event) {
        logoutSocket.send(JSON.stringify({'message': 'login'}));
    }
    logoutSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'login') {
            logoutSocket.send(JSON.stringify({'message': 'delete_from_group'}));
            document.cookie = 'sessionid=; Max-Age=0; path=/';
            fetchAlerts('You logged in somewhere else. You have been disconnected.', 'success');
            logoutSocket.close();
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    }
    window.history.pushState({}, "", "/user/");
    window.dispatchEvent(new PopStateEvent('popstate'));
}

const showLogin = async () => {
    document.getElementById("loginForm").addEventListener('submit', async function(event) {
        event.preventDefault();
        try {
            const previousErrorMessage = document.querySelector('.error-message');
            if (previousErrorMessage) {
                previousErrorMessage.remove();
            }
            const formData = new FormData(this);
            const response = await fetch('/loginForm/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                if (data['2fa']) {
                    window.history.pushState({}, "", '/verify2FA/' + data.user_id + '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
                else {
                    handleLoginResponse();
                }
            } else {
                const previousErrorMessage = document.querySelector('.errors-messages');
                if (previousErrorMessage) {
                    previousErrorMessage.remove();
                }
                errorList = data.errors.__all__;
                html = '<div class="errorlist">'
                for (let key in errorList) {
                    html += '<span>' + errorList[key] + '</span>';
                }
                html += '</div>';
                const errorDiv = document.createElement('div');
                errorDiv.classList.add('errors-messages');
                errorDiv.classList.add('mt-4');
                errorDiv.classList.add('text-center');
                errorDiv.innerHTML = html;
                document.getElementById("loginForm").appendChild(errorDiv);
            }
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la soumission du formulaire :', error);
            fetchAlerts();
        }
    })
}


let socketSignup = null;
async function loginSocket() {
    if (socketSignup && socketSignup.readyState === WebSocket.OPEN) {
        // chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
        socketSignup.close();
    }
    if (!socketSignup || socketSignup.readyState !== WebSocket.OPEN) {
        socketSignup = new WebSocket('wss://' + window.location.host + '/ws/get_user/');
        socketSignup.onopen = function(event) {
            // console.log('socketSignup is open!');	
            socketSignup.send(JSON.stringify({'message': 'new_user'}));
        };
        socketSignup.onmessage = function(event) {
            socketSignup.close();
        }; 
        socketSignup.onclose = function(e) {
            // console.log('socketSignup closed');
        };
    }
}

function handleSignupResponse() {
    logoutSocket = new WebSocket('wss://' + window.location.host + '/ws/logoutConsumer/');
    logoutSocket.onopen = function(event) {
        logoutSocket.send(JSON.stringify({'message': 'signup'}));
    }
    logoutSocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'login') {
            logoutSocket.send(JSON.stringify({'message': 'delete_from_group'}));
            document.cookie = 'sessionid=; Max-Age=0; path=/';
            fetchAlerts('You logged in somewhere else. You have been disconnected.', 'success');
            logoutSocket.close();
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    }
    logoutSocket.onclose = function(event) {
        // console.log('logoutSocket connection closed');
    }
    loginSocket();
    window.history.pushState({}, "", "/user/");
    window.dispatchEvent(new PopStateEvent('popstate'));
}

const showSignup = async () => {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const predefinedAvatarInput = document.getElementById('id_predefined_avatar');

    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                predefinedAvatarInput.value = '';
            } else {
                avatarOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                predefinedAvatarInput.value = this.getAttribute('data-avatar');
            }
        });
    });

    document.getElementById("signupForm").addEventListener('submit', async function(event) {
        event.preventDefault();
        try {
            const previousErrorMessage = document.querySelector('.error-message');
            if (previousErrorMessage)
                previousErrorMessage.remove();
            const formData = new FormData(this);
            const response = await fetch('/signupForm/', {
                method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                body: formData,
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                handleSignupResponse();
            } else {
                const previousErrorMessage = document.querySelector('.errors-messages');
                if (previousErrorMessage)
                    previousErrorMessage.remove();
                let errorList = [];
                if (data.errors['username'])
                    errorList = errorList.concat(data.errors['username']);
                if (data.errors['__all__'])
                    errorList = errorList.concat(data.errors['__all__']);
                html = '<div class="errorlist">'
                for (let key in errorList) {
                    html += '<span>' + errorList[key] + '</span><br>';
                }
                html += '</div>';
                const errorDiv = document.createElement('div');
                errorDiv.classList.add('errors-messages');
                errorDiv.classList.add('mt-4');
                errorDiv.classList.add('text-center');
                errorDiv.innerHTML = html;
                document.getElementById("signupForm").appendChild(errorDiv);
            }
        } catch (error) {
            console.error('Erreur lors de la soumission du formulaire : ', error);
            fetchAlerts();
        }
        })
}

const showUser = async () => {
    global_id = await pullIdFromBack();
}

let socketGetGroup =  null;
function getGroup(userId) {
	if (socketGetGroup && socketGetGroup.readyState === WebSocket.OPEN) {
		// chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
		socketGetGroup.close();
	}
	if (!socketGetGroup || socketGetGroup.readyState !== WebSocket.OPEN) {

        socketGetGroup = new WebSocket('wss://' + window.location.host + '/ws/get_group/');
        socketGetGroup.onopen = function(event) {
            // console.log('socketGetGroup is open!');
            const data = { message: 'show_group' };
            socketGetGroup.send(JSON.stringify(data));
        };
        socketGetGroup.onmessage = async function(event) {
            var data = JSON.parse(event.data);
            // console.log("data.content = ", data.content)
            if (data.content === "Get_Group") {
                var is_group = false;
                // console.log(data.chat_groups);
                const existingGroupItems = document.querySelectorAll('.group-item');
                // console.log("existingGroupItems = ", existingGroupItems);
                existingGroupItems.forEach(item => item.remove());
                data.chat_groups.forEach((group) => {
                    // const group = data.group;
                    console.log("UserID = ", userId)
                    if (group && Array.isArray(group.members) && Array.isArray(group.members_id)) {
                        console.log("OK")
                        const selectedUsersDisplay = [];
                        group.members.forEach((username, index) => {
                            const id = group.members_id[index];
                            selectedUsersDisplay.push({
                                profile: group.members[index],
                                members_id: group.members_id[index],
                                members_avatar: group.members_avatar[index],
                                members_status: group.members_status[index],
                                id: id,
                                username: username
                            });
                        });
                        const membersIDsAsString = group.members_id.map(id => id.toString());
                        if (membersIDsAsString.includes(userId.toString())) {
                            is_group = true;
                            title_groups = document.getElementById('title-groups').style.display = "block";
                            addGroupToDOM(group, selectedUsersDisplay);
                        }
                    } else {
                        // console.error("Invalid group data received", group);
                    }
                });
                if (!is_group) {
                    title_groups = document.getElementById('title-groups');
                    title_groups.style.display = "none";
                }
            }
            else if (data.content === "Get_User") {
                try {
                    const response = await fetch('/getFriends/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    if (!response.ok) {
                        console.log("response = ", response)
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    console.log("data = ", data)
                    if (data.friends > 0) {
                        console.log("a des amis")
                        document.getElementById('title-friends').style.display = "block";
                    } else {
                        document.getElementById('title-friends').style.display = "none";
                    }
                    if (data.other > 0) {
                        console.log("a des autres")
                        document.getElementById('title-other').style.display = "block";
                    } else {
                        document.getElementById('title-other').style.display = "none";
                    }
                } catch (error) {
                    fetchAlerts();
                }
                const userItems = document.querySelectorAll('.user-item');
                userItems.forEach(item => item.remove());
                data.users.forEach(async (user) => {
                    // console.log("user = ", user)
                    userItems.forEach(userItem => userItem.classList.remove('clicked'));
                    const selectedUserId = user.userId;
                    const selectedUserName = user.username;
                    const selectedUserProfile = user.profile;
                    const selectedUser = [{ id: selectedUserId, username: selectedUserName, profile: selectedUserProfile }];
                    if (selectedUserId.toString() !== userId) {
                        addProfileToDOM(selectedUser[0].profile, selectedUser, userId);
                    }
                });
            }
            // else {
            //     socketGetGroup.close();
            // }
        };

        socketGetGroup.onclose = function(event) {
            // console.log('socketGetGroup connection closed');
        };

        socketGetGroup.onerror = function(error) {
            // console.error('socketGetGroup error observed:', error);
        };
    }
}

const showChat = async () => {
    const userId = document.getElementById('user_id').textContent;
    // requete pour savoir si l'utilisateur a des amis ou autres  
    

    title_friends = document.getElementById('title-friends');
    // si pas d'ami
    title_other = document.getElementById('title-other');
    // si pas d'autre
    getGroup(userId);
}

let to_pop_in_tournament = true;
window.addEventListener('popstate', function() {
	// console.log('popstate event triggered');
	if (socketGetGroup && socketGetGroup.readyState === WebSocket.OPEN) {
		socketGetGroup.close();
	}
	if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
		chatSocket.close();
	}
    if (askFriendSocket && askFriendSocket.readyState === WebSocket.OPEN) {
        askFriendSocket.close();
    }
	if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
        to_pop_in_tournament = false;
	}
});

const showLocalGame = async () => {
    console.log("showLocalGame()");
    startGame();
}

const showVSIAGame = async () => {
    console.log("showVSIAGame()");
    startIAGame();
}

const showGame = async () => {
    
}

const showProfile = async () => {
    const id = await pullIdFromBack();
    try {
        const response1 = await fetch('/getProfile/' + id + '/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        if (!response1.ok) {
            throw new Error(`HTTP error! status: ${response1.status}`);
        }
        const data = await response1.json();
        const profil = JSON.parse(data.profil);
        pastille = document.getElementById("status-span");
        if (pastille) {
            if (profil.status === 'active') {
                pastille.classList.add("bg-success");
            }
            else if (profil.status === 'inactive')
                pastille.classList.add("bg-danger");
            else if (profil.status === 'in_game')
                pastille.classList.add("bg-warning");
            else {
                pastille.classList.add("bg-secondary");
            }
        }
        if (profil.avatar) {
            document.getElementById("avatarImage").style.display = "block";
            document.getElementById("avatarImage").src = profil.avatar;
            button_delete_avatar = document.getElementById("delete-avatar");
            if (button_delete_avatar) {
                button_delete_avatar.style.display = "block";
            }
        } else {
            document.getElementById("avatarIcon").style.display = "block";
        }
    } catch (error) {
        fetchAlerts();
    }
    
    
    button2FA = document.getElementById("2FA");
    if (button2FA) {
        button2FA.addEventListener('click', async function() {
            if (this.checked) {
                userId = await pullIdFromBack();
                try {
                    const response = await fetch('/enable2FA/' + userId + '/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const response2 = await fetch('/getProfile/' + id + '/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken'),
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    if (!response2.ok) {
                        throw new Error(`HTTP error! status: ${response2.status}`);
                    }
                    const data = await response2.json();
                    const profil = JSON.parse(data.profil);
                    qrcode = profil.qr_code;
                    } catch (error) {
                        fetchAlerts();
                    }
                } else {
                    userId = await pullIdFromBack();
                    try {
                        const response = await fetch('/disable2FA/' + userId + '/', { 
                            method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                    })
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    // document.getElementById("modalQrCode").style.display = "none";
                } catch (error) {
                    fetchAlerts('2FA could not be disable.', 'danger');
                }
            }
        });
    }
    icon = document.getElementById("icon-qrcode");
    if (icon) {
        icon.onclick = async function() {
            const response2 = await fetch('/getProfile/' + id + '/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            if (!response2.ok) {
                throw new Error(`HTTP error! status: ${response2.status}`);
            }
            const data2 = await response2.json();
            const profil = JSON.parse(data2.profil);
            qrcode = profil.qr_code;
            if (button2FA.checked) {
                if (document.getElementById("modalQrCode").style.display === "block") {
                    document.getElementById("modalQrCode").style.display = "none";
                } else {
                    document.querySelector("#modalQrCode img.qr-code").src = profil.qr_code;
                    document.getElementById("modalQrCode").style.display = "block";
                
                }

            }
        }
    }
    
    // if (socketPhoto && socketPhoto.readyState === WebSocket.OPEN) {
    //     console.log("socketPhoto.readyState = ", socketPhoto.readyState)
    //     socketPhoto.onmessage = function(e) {
    //         const data = JSON.parse(e.data);
    //         console.log("data.content = ", data.message)
    //     }
    // }
}

function createButton() {
    // Vérifie si le bouton existe déjà
    const existingButton = document.getElementById('show_tournament');
    if (existingButton) {
        // Supprime le bouton existant
        existingButton.remove();
    } else {
        return;
    }

    // Crée un nouveau bouton
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'show_tournament';
    button.className = 'join_queue translate';
    button.style.width = '300px';
    button.onclick = joinYourTournament;
    button.innerText = 'Join your tournament';

    // Ajoute le bouton au conteneur
    document.getElementById('ButtonJoinTournament').appendChild(button);
}

let socketLobbyCreator = null;
const showLobby = async (tournament_name, userId) => {
    console.log("showLobby");

	if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
		socketLobbyCreator.close();
	}
	if (!socketLobbyCreator || socketLobbyCreator.readyState !== WebSocket.OPEN) {
        socketLobbyCreator = new WebSocket(`wss://${window.location.host}/ws/pong/lobby/${tournament_name}/`);
        to_pop_in_tournament = true;
        socketLobbyCreator.onopen = function(event) {
            console.log('socketLobbyCreator is open!');
            socketLobbyCreator.send(JSON.stringify({message : 'new_user', tournament_name: tournament_name, userId: userId}));
        };
        socketLobbyCreator.onmessage = function(event) {
            var dataLobby = JSON.parse(event.data);
            // console.log("dataLobby.content = ", dataLobby.content)
            if (dataLobby.content === 'tournament_deleted') {
                console.log('tournament_deleted');
                window.history.pushState({}, "", `/game/`);
                window.dispatchEvent(new PopStateEvent("popstate"));
                createButtonLobby();
                socketLobbyCreator.close();
            }
            else if (dataLobby.content === 'new_user') {
                updateNbPlayers(dataLobby);
                fillPlayersInHTML(dataLobby);
                console.log("data.survivor_idddddd showLobby = ", dataLobby.survivor_id);
                if (dataLobby.tournament_nb_player_direct === dataLobby.tournament_nb_player && dataLobby.survivor_id.toString() === userId.toString())
                {
                    socketLobbyCreator.send(JSON.stringify({message : 'launch', tournament_name: tournament_name}));
                }
            }
            else if (dataLobby.content === 'leave_user') {
                updateNbPlayers(dataLobby);
                fillPlayersInHTML(dataLobby);
                if (dataLobby.sender_id === userId) {
                    console.log("TEST2")
                    socketLobbyCreator.close();
                }
            }
            else if (dataLobby.content === 'launch_tournament') {
                let strFetch = "Tournament " + tournament_name + " launched!!"
                fetchAlerts(strFetch, "success");

                if (to_pop_in_tournament) {
                    window.history.pushState({}, "", `/game/pong/tournament/${tournament_name}`);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                }
                createButton();
				if (data.userId === userId) {
                    console.log(userId)
					socketLobbyCreator.close();
				}
                launchTournament(userId, tournament_name, true);						
            }
        }
        socketLobbyCreator.onclose = function(event) {
            console.log('socketLobbyCreator connection closed');
        };
    }
}

function createButtonLobby() {
    // Vérifie si le bouton existe déjà
    const existingButton = document.getElementById('show_tournament');
    if (existingButton) {
        // Supprime le bouton existant
        existingButton.remove();
    } else {
        return;
    }

    // Crée un nouveau bouton
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'show_tournament';
    button.className = 'join_queue translate';
    button.style.width = '300px';
    button.onclick = openModalTournament;
    button.innerText = 'Join a tournament';

    // Ajoute le bouton au conteneur
    document.getElementById('ButtonJoinTournament').appendChild(button);
}

const showTournament = async (tournament_name, userId) => {


    LaunchGenerateMatches(0, 0);
    let match_id = null;
    try {
        const response = await fetch(`/user/${userId}/game/${tournament_name}/get_match_id`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        match_id = data.match_id
	} catch (error) {
        console.error('Error :', error);
        fetchAlerts();
        return null;
    }

	let readyButton = document.getElementById("readyButton");

    if (match_id === false) {
        readyButton.innerHTML = await translate('Back to Menu');
        readyButton.onclick = function() {
            window.history.pushState({}, "", `/user/`);
            window.dispatchEvent(new PopStateEvent("popstate"));
        };
    } else {
        if (socketMatch && socketMatch.readyState === WebSocket.OPEN) {
            // chatSocketTournament.onclose = function() {}; // Ignorer les événements de fermeture
            socketMatch.close();
        }
        if (!socketMatch || socketMatch.readyState !== WebSocket.OPEN) {
            socketMatch = new WebSocket(`wss://${window.location.host}/ws/pong/tournament/${tournament_name}/${match_id}/`);
            // socketMatch.onopen = function(event) {
            // 	console.log('socketMatch is open!');
            // 	sendReadyState();
            // };
    
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
}



// ------------------------------------------ //

// var user_item = document.getElementsByClassName('user-item');
// // console.log("user_item = ", user_item);
// var user_items_array = Array.from(user_item);
// user_items_array.forEach(function(item) {
//     // console.log(item.dataset.username);
//     // console.log(item)
//     if (item.dataset.username == user.username) {
//         item.remove();
//         const container_friends = document.getElementById('user-list-friends');
//         container_friends.appendChild(item);
//     }
// });