let chatSocket = null;
let askFriendSocket = null;

async function fill_user_infos(profile, user_id) {
    var userID = JSON.parse(document.getElementById('user_id').textContent);
    var status = profile.status;
        // Définir la couleur et le texte du statut
        var statusColor;
        var statusText;
        if (status === 'active') {
            statusColor = 'green';
            statusText = await translate('Active');;
        } else if (status === 'inactive') {
            statusColor = 'red';
            statusText = await translate('Inactive');
        } else if (status === 'in_game') {
            statusColor = '#ffc107';
            statusText = await translate('Playing');
        } else {
            statusColor = 'gray';
            statusText = await translate('Undefined');
        }
    try {
        const friends_status = await fetch('/friend_status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({'user_id': userID, 'selectedUserId': selectedUserId }),
        });
        const data = await friends_status.json();
        const friendStatus = data.status;
        if (friendStatus === 'friends') {
            document.getElementById("user-infos").innerHTML = `
                <div class="text-white user-info" style="text-align: center;">
                <p class="translate text-center" style="color:black;">`+ await translate('User infos') + `</p>
                    <div style="display: flex; align-items: center; justify-content: center; margin: 10px auto;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background-color: ${statusColor}; margin-right: 10px;"></div>
                        <span class="translate" style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
                    </div>
                    ${
                        profile.avatar
                        ? `<img src="${profile.avatar}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%;">`
                        : `<i class="bi bi-person-circle" style="font-size: 100px; color: black;"></i>`
                    }
                    <a href="/profile/${user_id}/" class="translate profile-link" style="text-decoration: none; color: black;">`+ await translate('Profile') + `</a>
                    <div style="display: flex; justify-content: center">
                        <p class="translate" style="color: black;"><strong>`+ await translate('Name:') + `</strong></p>
                        <p style="color: black; padding-left: 5px">${profile.username}</p>
                    </div>
                    <p style="color: black;"><strong>Bio:</strong> ${profile.bio}</p>
                </div>
            `;
        } else {
            document.getElementById("user-infos").innerHTML = `
                <div class="" style="text-align: center;">
                    <p class="translate text-center" style="color:black;">`+ await translate('You need to be friend with to see user informations') + `</p>
                </div>
            `
        }
    } catch (error) {
        fetchAlerts();
    }
}

async function addUserName(selectedUsers) {
    var userNameElement = document.querySelector('#selected-user-name');
    // Supprimer les éléments précédents
    userNameElement.innerHTML = '';
    var userList = document.createElement('ul');
    userList.classList.add('user-list');
    
    selectedUsers.forEach(function(user) {
        const userId = document.getElementById('user_id').textContent;
        if (userId != user.id) {
            // Créer un élément de liste pour chaque utilisateur
            var listItem = document.createElement('li');
            // Créer une div pour contenir l'image et le nom
            var userContainer = document.createElement('div');
            userContainer.classList.add('user-container'); // Ajouter une classe pour le style flex
            userContainer.style.display = "flex";
            userContainer.style.alignItems = "center";
            
            if (user.profile.avatar) {
                // Créer l'élément image
                var img = document.createElement('img');
                img.src = user.profile.avatar;
                img.style.width = "60px"; // Définir la largeur à 60 pixels
                img.style.height = "60px";
                img.style.borderRadius = "50%"; // Rendre l'image ronde
                img.style.padding = "10px";
                img.alt = "Avatar";
                // Ajouter l'image à la div de conteneur d'utilisateur
                userContainer.appendChild(img);
            } else {
                // Si l'utilisateur n'a pas d'avatar, vous pouvez ajouter une icône par défaut
                var iconContainer = document.createElement('div');
                iconContainer.style.width = "60px"; // Définir la largeur à 60 pixels
                iconContainer.style.height = "60px"; // Définir la hauteur à 60 pixels
                iconContainer.style.display = "flex";
                iconContainer.style.alignItems = "center";
                iconContainer.style.justifyContent = "center";
                iconContainer.style.padding = "10px";
                
                var icon = document.createElement('i');
                icon.classList.add('bi', 'bi-person-circle');
                icon.style.fontSize = "40px"; // Définir la taille de l'icône pour l'adapter au conteneur
                icon.style.color = "black"; // Couleur par défaut
                
                iconContainer.appendChild(icon);
                userContainer.appendChild(iconContainer);
            }

            // Créer un élément pour le nom de l'utilisateur
            var userName = document.createElement('span');
            userName.textContent = user.username;
            userName.style.marginLeft = "10px"; // Ajouter de l'espace entre l'image/l'icône et le nom
            // Ajouter le nom de l'utilisateur à la div de conteneur d'utilisateur
            userContainer.appendChild(userName);
            // Ajouter la div de conteneur d'utilisateur à l'élément de liste
            listItem.appendChild(userContainer);
            // Ajouter l'élément de liste à la liste
            userList.appendChild(listItem);
        }
    });
    // Ajouter la liste d'utilisateurs au conteneur
    userNameElement.appendChild(userList);
    if (selectedUsers.length === 1) {
        var profile = selectedUsers[0].profile;
        var user_id = selectedUsers[0].id;
        var profile_username = profile.username;
        var bio = profile.bio;

        try {
            const response = await fetch(`/checkSession/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ id: user_id }),
            });
        } catch (error) {
            fetchAlerts();
        }

        var status = profile.status;
    
        // Définir la couleur et le texte du statut
        var statusColor;
        var statusText;
        if (status === 'active') {
            statusColor = 'green';
            statusText = await translate('Active');;
        } else if (status === 'inactive') {
            statusColor = 'red';
            statusText = await translate('Inactive');
        } else if (status == 'in_game') {
            statusColor = '#ffc107';
            statusText = await translate('Playing');
        } else {
            statusColor = 'gray';
            statusText = await translate('Undefined');
        }

        fill_user_infos(profile, user_id);        
        preventLinks();
    }
}

function display_button_friend(status) {
    const userID = JSON.parse(document.getElementById('user_id').textContent);
    div = document.getElementById('div-ask-friend');
    ask_button = document.getElementById('ask-friend');
    delete_friend = document.getElementById('delete-friend');
    accept_button = document.getElementById('accept-friend');
    refuse_button = document.getElementById('refuse-friend');
    waiting_button = document.getElementById('waiting');
    if (status === 'friends') {
        delete_friend.style.display = 'block';
        ask_button.style.display = 'none';
        waiting_button.style.display = 'none';
        accept_button.style.display = 'none';
        refuse_button.style.display = 'none';
    } else if (status === 'need_answer') {
        ask_button.style.display = 'none';
        delete_friend.style.display = 'none';
        waiting_button.style.display = 'none';
        accept_button.style.display = 'block';
        refuse_button.style.display = 'block';
        accept_button.onclick = async function() {
            delete_friend.style.display = 'none';
            accept_button.style.display = 'none';
            refuse_button.style.display = 'none';
            askFriendSocket.send(JSON.stringify({'message': 'accept_friend', 'user_id': userID, 'selectedUserId': selectedUserId}));
        }
        refuse_button.onclick = async function() {
            delete_friend.style.display = 'none';
            accept_button.style.display = 'none';
            refuse_button.style.display = 'none';
            askFriendSocket.send(JSON.stringify({'message': 'refuse_friend', 'user_id': userID, 'selectedUserId': selectedUserId}));
        }
    } else if (status === 'waiting_answer') {
        waiting_button.style.display = 'block';
        delete_friend.style.display = 'none';
        ask_button.style.display = 'none';
        accept_button.style.display = 'none';
        refuse_button.style.display = 'none';
    } else {
        ask_button.style.display = 'block';
        delete_friend.style.display = 'none';
        waiting_button.style.display = 'none';
        accept_button.style.display = 'none';
        refuse_button.style.display = 'none';
    }

}

// function loadinput() {
//     // Créer le conteneur div
//     console.log("loadinput");
//     var divContainer = document.getElementById('forinputchat');
//     // divContainer.id = "forinputchat";
//     divContainer.className = "input-container";
//     divContainer.style.display = "flex";
//     divContainer.style.alignItems = "center";
//     divContainer.style.padding = "10px";
//     divContainer.style.borderBottomLeftRadius = "10px";
//     divContainer.style.borderBottomRightRadius = "10px";
//     divContainer.style.backgroundColor = "white";

//     // Créer l'input text
//     var textInput = document.createElement('input');
//     textInput.className = "textInput";
//     textInput.id = "chat-message-input";
//     textInput.type = "text";
//     textInput.style.flex = "1";
//     textInput.style.padding = "10px";
//     textInput.style.backgroundColor = "white";
//     textInput.style.borderRadius = "5px";
//     textInput.style.marginRight = "10px";
//     textInput.style.border = "1px solid rgb(164, 163, 163)";

//     // Créer le bouton
//     var button = document.createElement('button');
//     button.className = "button";
//     button.id = "chat-message-submit";
//     button.style.backgroundColor = "transparent";
//     button.style.border = "none";
//     button.style.color = "black";

//     // Créer l'icône à l'intérieur du bouton
//     var icon = document.createElement('i');
//     icon.className = "fas fa-paper-plane";

//     // Ajouter l'icône au bouton
//     button.appendChild(icon);

//     // Ajouter l'input et le bouton au conteneur div
//     divContainer.appendChild(textInput);
//     divContainer.appendChild(button);

//     // Ajouter le conteneur div au corps du document ou à un autre élément parent
//     document.body.appendChild(divContainer); // Changez document.body pour un autre parent si nécessaire

// }

let selectedUserId = null;
async function initMessage(selectedUsers, group_name) {
    // console.log("initMessage")
    var userID = JSON.parse(document.getElementById('user_id').textContent);
    // if (document.querySelector('.user-item.clicked')) {
    //     selectedUserId = document.querySelector('.user-item.clicked').dataset.userId;
    // }
    // else {
    //     selectedUserId = group_name;
    // }
    
    // Si un seul utilisateur est sélectionné, faire la requête pour vérifier s'il est bloqué
    if (selectedUsers.length === 1) {
        // loadinput();
        document.getElementById('forinputchat').style.display = 'flex';
        try {
            selectedUserId = selectedUsers[0].id;
            // console.log("selectedUserId2 = ", selectedUserId)
            const response = await fetch(`/user/${userID}/chat/check_is_blocked/${selectedUserId}/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            var blockButton = document.getElementById('block-btn');
            if (!data.it_is_blocked) {
                blockButton.textContent = await translate('Block user');
                blockButton.onclick = blockUser;
            } else {
                blockButton.textContent = await translate ('Unblock user');
                blockButton.onclick = unblockUser;
            }
            // ---------------------------FRIENDSHIP----------------------------
            const friends_status = await fetch('/friend_status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({'user_id': userID, 'selectedUserId': selectedUserId }),
            });
            const data2 = await friends_status.json();
            const friendStatus = data2.status;
            display_button_friend(friendStatus);
    
        } catch (error) {
            fetchAlerts();
            console.log("CETTE ALERTE 1");
        }
    }
    else {
        document.getElementById('forinputchat').style.display = 'none';
        selectedUserId = group_name;
    }

    // console.log("selectedUserId = ", selectedUserId)
    // Trier les IDs pour créer le nom de la conversation
    let roomName = null;

    if (group_name.length === 0) {
        selectedUsers.push({ id: userID });
        const sortedUserIDs = selectedUsers.map(user => user.id).sort((a, b) => a - b);
        roomName = sortedUserIDs.join('_');
    } else {
        roomName = group_name;
    }
    console.log("roomName ===== ", roomName)
    // Affichage de la boîte de dialogue
    const dialogBox = document.getElementById('containerText');
    dialogBox.style.display = 'block';
    loadMessages(roomName, selectedUserId);
    setTimeout(scrollToBottom, 100);
    
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        // chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
        chatSocket.close();
    }
    
    // Connexion WebSocket si elle n'existe pas déjà
    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN || chatSocket.url.split('/').slice(-2)[0] !== roomName) {

        if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
            // chatSocket.onclose = function() {}; // Ignorer les événements de fermeture
            chatSocket.close();
        }
        // Connexion WebSocket
        chatSocket = new WebSocket('wss://' + window.location.host + '/ws/chat/' + roomName + '/');
        chatSocket.onopen = function(event) {
            // console.log('chatSocket is open!');
        };

        if (!askFriendSocket || askFriendSocket.readyState !== WebSocket.OPEN) {
            askFriendSocket = new WebSocket('wss://' + window.location.host + '/ws/ask_friend/' + roomName + '/');
            askFriendSocket.onopen = function(event) {
                console.log('askFriendSocket is open!');
            };
            askFriendSocket.onmessage = async function(e) {
                const data = JSON.parse(e.data);
                if (data.message) {
                    console.log("MESSAGE RECU");
                }
                if (data.message === 'ask_friend_send') {
                    if (data.user_id === userID) {
                        display_button_friend('waiting_answer');
                    } else {
                        display_button_friend('need_answer');
                    }
                } else if (data.message === 'accept_friend') {
                    var user_item = document.getElementsByClassName('user-item');
                    console.log("user_item = ", user_item);
                    var user_items_array = Array.from(user_item);
                    user_items_array.forEach(function(item) {
                        console.log(item.dataset.username);
                        if (item.dataset.username == selectedUsers[0].username) {
                            item.remove();
                            const container_friends = document.getElementById('user-list-friends');
                            document.getElementById('title-friends').style.display = "block";
                            container_friends.appendChild(item);
                        }
                    });
                    display_button_friend('friends');
                    fill_user_infos(selectedUsers[0].profile, selectedUsers[0].id);
                } else if (data.message === 'refuse_friend') {
                    display_button_friend('not_friends');
                } else if (data.message === 'delete_friend') {
                    console.log("delete_friend")
                    var user_item = document.getElementsByClassName('user-item');
                    console.log("user_item = ", user_item);
                    var user_items_array = Array.from(user_item);
                    user_items_array.forEach(function(item) {
                        console.log(item.dataset.username);
                        if (item.dataset.username == selectedUsers[0].username) {
                            item.remove();
                            const container_not_friends = document.getElementById('user-list-not-friends');
                            container_not_friends.appendChild(item);
                        }
                    });
                    display_button_friend('not_friends');
                    document.getElementById("user-infos").innerHTML = `
                        <div class="" style="text-align: center;">
                            <p class="translate text-center" style="color:black;">`+ await translate('You need to be friend with to see user informations') + `</p>
                        </div>
                    `
                }
            }
            askFriendSocket.onclose = function(e) {
                console.log('askFriendSocket closed');
            }
        }
        document.getElementById('ask-friend').onclick = function() {
            console.log('ask friend');
            console.log("userID = ", userID);
            console.log("ask selectedUserId = ", selectedUserId);
            askFriendSocket.send(JSON.stringify({'message': 'ask_friend', 'user_id': userID, 'selectedUserId': selectedUserId}));
        };
        document.getElementById('delete-friend').onclick = function() {
            console.log('delete friend');
            askFriendSocket.send(JSON.stringify({'message': 'delete_friend', 'user_id': userID, 'selectedUserId': selectedUserId}));
        };

        const chatLog = document.querySelector('#chat-log')
        // console.log("roomName:", roomName);
        // Réception des messages WebSocket
        chatSocket.onmessage = async function(e) {
            const data = JSON.parse(e.data);
            // console.log("data.content = ", data.content)
            if (data.content === "Two_Players_Ready") {
                if (receiveSocket && receiveSocket.readyState === WebSocket.OPEN) {
                    receiveSocket.close();
                }
                if (inviteSocket && inviteSocket.readyState === WebSocket.OPEN) {
                    inviteSocket.close();
                }
                launchGameInvitation(roomName, userID);
            }
            else if (data.content === "Reload") {
                loadMessages(roomName, selectedUserId);
            }
            else if (data.content !== "Two_Players_Ready" &&
                    data.content !== "Ready_alone" &&
                    data.content !== "Ready_Impossible" &&
                    data.content !== "blocked_by" &&
                    data.content !== "is_blocked" &&
                    data.content !== "Reload") {
                const messageElement = document.createElement('div')
                const userId = data['user_id']
                const loggedInUserId = JSON.parse(document.getElementById('user_id').textContent)
                
                // Créer un élément pour afficher le message
                const messageContentElement = document.createElement('div');
                messageContentElement.innerText = data.message;
                // Ajouter les classes CSS en fonction de l'émetteur du message
                // console.log("data.message = ", data.message, " userId = ", typeof(userId))
                if (userId === loggedInUserId) {
                    messageElement.classList.add('message', 'sender');
                } else {
                    messageElement.classList.add('message', 'receiver');
                }
                
                // Vérifier si le message précédent a été envoyé par le même utilisateur
                var lastMessageElement = chatLog.lastElementChild;
                // let userNameElement = null;
                if (lastMessageElement && !lastMessageElement.getAttribute('data-user-id')) {
                    lastMessageElement = await fetchLastMessageFromDB(userId, roomName);
                    if (lastMessageElement) {
                        const lastUserId = lastMessageElement ? parseInt(lastMessageElement.user_id) : null;
                        addUsernameToChatLog(lastMessageElement, lastUserId, userId, loggedInUserId, chatLog, data);
                    }
                }
                else {
                    const lastUserId = lastMessageElement ? parseInt(lastMessageElement.getAttribute('data-user-id')) : null;
                    addUsernameToChatLog(lastMessageElement, lastUserId, userId, loggedInUserId, chatLog, data);
                }
                // Ajouter l'ID de l'utilisateur comme attribut de données pour le message
                messageElement.setAttribute('data-user-id', userId);
                
                // Ajouter les éléments au chatLog
                messageElement.appendChild(messageContentElement);
                if (data.content === "invite_message" && userId !== loggedInUserId) {
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.style.display = 'flex';
                    buttonsContainer.style.justifyContent = 'center';
                    
                    buttonsContainer.classList.add('invite-buttons');
                    const yesButton = document.createElement('button');
                    yesButton.innerText = 'Yes';
                    yesButton.style.fontSize = '10px';
                    yesButton.style.backgroundColor = '#4CAF50';
                    yesButton.style.color = 'white';
                    yesButton.style.border = 'none';
                    yesButton.style.borderRadius = '5px';
                    yesButton.style.padding = '5px 10px';
                    yesButton.onclick = function() {
                        // Logique pour accepter l'invitation
                        // console.log('Invitation accepted');
                        noButton.style.display = 'none';
                        yesButton.disabled = true;
                        chatSocket.send(JSON.stringify({'content': 'invite_yes', 'user_id': userID, 'selectedUserId': selectedUserId }));
                        receivePlay(roomName, loggedInUserId)
                    };
                    const noButton = document.createElement('button');
                    noButton.innerText = 'No';
                    noButton.style.backgroundColor = 'red';
                    noButton.style.fontSize = '10px';
                    noButton.style.color = 'white';
                    noButton.style.border = 'none';
                    noButton.style.borderRadius = '5px';
                    noButton.style.padding = '5px 10px';
                    noButton.onclick = function() {
                        // Logique pour refuser l'invitation
                        // console.log('Invitation declined');
                        yesButton.style.display = 'none';
                        noButton.disabled = true;
                        chatSocket.send(JSON.stringify({'content': 'invite_no', 'user_id': userID, 'selectedUserId': selectedUserId }));
                    };
                    buttonsContainer.appendChild(yesButton);
                    buttonsContainer.appendChild(noButton);
                    yesButton.style.marginRight = '10px';
                    messageElement.appendChild(buttonsContainer);               
                }
                else if (data.content === "are_you_ready" && userId === loggedInUserId) {
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.classList.add('ready-buttons');
                    buttonsContainer.style.display = 'flex';
                    buttonsContainer.style.justifyContent = 'center';
                    const readyButton = document.createElement('button');
                    readyButton.innerText = 'Ready';
                    readyButton.style.backgroundColor = '#00a7b3';
                readyButton.style.fontSize = '10px';
                readyButton.style.color = 'white';
                readyButton.style.border = 'none';
                readyButton.style.borderRadius = '5px';
                readyButton.style.padding = '5px 10px';
                    readyButton.onclick = function() {
                        readyButton.disabled = true;
                        readyButton.style.backgroundColor = 'red';
                        readyButton.innerText = 'Waiting';
                        readyButton.style.backgroundColor = 'red';
                        readyButton.style.fontSize = '10px';
                        readyButton.style.color = 'white';
                        readyButton.style.border = 'none';
                        readyButton.style.borderRadius = '5px';
                        readyButton.style.padding = '5px 10px';
                        chatSocket.send(JSON.stringify({'content': 'ready', 'user_id': userId, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId}));
                    };
                    buttonsContainer.appendChild(readyButton);
                    messageElement.appendChild(buttonsContainer);               
                }

                chatLog.appendChild(messageElement);
                
                if (document.querySelector('#emptyText')) {
                    document.querySelector('#emptyText').remove()
                }
                const containerText = document.getElementById('containerText');
                containerText.scrollTop = containerText.scrollHeight;
            }
        };
        
        chatSocket.onclose = function(e) {
            // console.log('Chat socket closed');
        };
    }
    
    // document.querySelector('#chat-message-input').focus();
    document.querySelector('#chat-message-input').onkeyup = function(e) {
        if (e.keyCode === 13) {  // enter, return
            // Vérifier si le message est vide
            const messageInputDom = document.querySelector('#chat-message-input');
            const message = messageInputDom.value.trim(); // Supprimer les espaces blancs avant et après
            if (message !== '') { // Si le message n'est pas vide
                document.querySelector('#chat-message-submit').click();
            }
        }
    };
    
    document.querySelector('#chat-message-submit').onclick = function(e) {
        // Vérifier si le message est vide
        const messageInputDom = document.querySelector('#chat-message-input');
        const message = messageInputDom.value.trim(); // Supprimer les espaces blancs avant et après
        if (message !== '') { // Si le message n'est pas vide
            const dataToSend = {
                'message': message,
                'selectedUsers': selectedUsers
            };
            // Si la taille de selectedUsers est 2, envoyer otherUserID
            if (selectedUsers.length === 2) {
                const otherUserID = selectedUsers.find(user => user.id !== userID).id;
                dataToSend.otherUserID = otherUserID;
            } else {
                // Si la taille de selectedUsers n'est pas 2, envoyer null ou ne pas envoyer otherUserID
                dataToSend.otherUserID = null; // Décommentez cette ligne si vous voulez envoyer null
                // Sinon, ne pas envoyer otherUserID
            }
            chatSocket.send(JSON.stringify(dataToSend));
            messageInputDom.value = '';
        }
    };
}

// Fonction pour récupérer le dernier message depuis la base de données
async function fetchLastMessageFromDB(userId, roomName) {
    try {
        const response = await fetch(`/user/${userId}/chat/get_last_message/${roomName}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.lastMessage;
    } catch (error) {
        console.error('Error fetching last message:', error);
        fetchAlerts();
        return null;
    }
}

// Fonction pour ajouter le nom d'utilisateur au chatLog
function addUsernameToChatLog(lastMessageElement, lastUserId, userId, loggedInUserId, chatLog, data) {
    if (!lastMessageElement || lastUserId !== userId) {
        // Créer un élément pour le nom d'utilisateur
        userNameElement = document.createElement('div');

        if (userId === null) {
            userNameElement.innerText = "BOT"; // Afficher le nom de l'utilisateur
            userNameElement.classList.add('username-message', 'username-receiver'); // Ajouter une classe CSS
        } else {       
            userNameElement.innerText = data['username'];
            // Ajouter les classes CSS en fonction de l'émetteur du message
            if (userId === loggedInUserId) {
                userNameElement.classList.add('username-message', 'username-sender');
            } else {
                userNameElement.classList.add('username-message', 'username-receiver');
            }
        }
        chatLog.appendChild(userNameElement);
    }
}



const loadMessages = async (roomName, selectedUserId) =>  {
    const userId = document.getElementById('user_id').textContent;
    // console.log("loadMessages");
    try {
        // Charger les messages existants depuis le serveur Django
        const response = await fetch(`/user/${userId}/chat/load_messages/${roomName}/`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Construire les éléments HTML à partir des données JSON
        const chatLog = document.querySelector('#chat-log');
        chatLog.innerHTML = ''; // Effacer le contenu précédent du chat log
        let lastUserId = null; // Garder une trace du dernier utilisateur
        data.chats.forEach( chat => {
            const messageElement = document.createElement('div');
            const userNameElement = document.createElement('div');
            const messageContentElement = document.createElement('div');
            
            // Ajouter le nom de l'utilisateur uniquement s'il est différent du précédent
            if (chat.user_id === null) {
                console.log("TEST BOT");
                userNameElement.innerText = "BOT"; // Afficher le nom de l'utilisateur
                userNameElement.classList.add('username-message', 'username-receiver'); // Ajouter une classe CSS
                chatLog.appendChild(userNameElement);
            } else if (chat.user_id !== lastUserId) {
                userNameElement.innerText = chat.username; // Afficher le nom de l'utilisateur
                if (chat.user_id == userId) {
                    userNameElement.classList.add('username-message', 'username-sender'); // Ajouter une classe CSS
                } else {
                    userNameElement.classList.add('username-message', 'username-receiver'); // Ajouter une classe CSS
                }
                chatLog.appendChild(userNameElement);
            }
            messageContentElement.innerText = chat.content;

            if (chat.user_id === null && (chat.player1_id === userId || chat.player2_id === userId)) {
                const lineBreak = document.createElement('br');
                const linkElement = document.createElement('a');
                linkElement.href = '#'; // Prévenir le comportement par défaut du lien
                // linkElement.innerText = await translate('Click here to go to the tournament');
                linkElement.innerText = 'Click here to go to the tournament';
                messageContentElement.appendChild(lineBreak);
                messageContentElement.appendChild(linkElement);
                linkElement.addEventListener('click', function(event) {
                    event.preventDefault(); // Empêcher le lien de faire sa redirection par défaut
                    // const tournament_name = 'votre_nom_de_tournoi'; // Remplacez par le nom de votre tournoi
                    window.history.pushState({}, "", `/game/pong/tournament/${roomName}`);
                    window.dispatchEvent(new PopStateEvent("popstate"));
                });
            } else {

            }
            if (chat.user_id == userId) {
                messageElement.classList.add('message', 'sender');
            } else {
                messageElement.classList.add('message', 'receiver');
            }
            messageElement.appendChild(messageContentElement);

            if (chat.is_invitation == true && chat.user_id != userId) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('invite-buttons');
                buttonsContainer.style.display = 'flex'; // Make the container flexible
                buttonsContainer.style.justifyContent = 'center';
                
                if (chat.is_answered === false) {
                    const yesButton = document.createElement('button');
                    yesButton.innerText = 'Yes';
                    yesButton.style.fontSize = '10px';
                    yesButton.style.backgroundColor = '#4CAF50';
                    yesButton.style.color = 'white';
                    yesButton.style.border = 'none';
                    yesButton.style.borderRadius = '5px';
                    yesButton.style.padding = '5px 10px';
                    yesButton.onclick = function() {
                        noButton.style.display = 'none';
                        yesButton.disabled = true;
                        chatSocket.send(JSON.stringify({'content': 'invite_yes', 'user_id': userId, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId}));
                        receivePlay(roomName, userId);
                    };
                    const noButton = document.createElement('button');
                    noButton.innerText = 'No';
                    noButton.style.backgroundColor = 'red';
                    noButton.style.fontSize = '10px';
                    noButton.style.color = 'white';
                    noButton.style.border = 'none';
                    noButton.style.borderRadius = '5px';
                    noButton.style.padding = '5px 10px';
                    noButton.onclick = function() {
                        yesButton.style.display = 'none';
                        noButton.disabled = true;
                        chatSocket.send(JSON.stringify({'content': 'invite_no', 'user_id': userId, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId}));
                    };
                    buttonsContainer.appendChild(yesButton);
                    buttonsContainer.appendChild(noButton);

                    yesButton.style.marginRight = '10px';
                }
                else if (chat.is_answered === true && chat.answer === true){
                    const yesButton = document.createElement('button');
                    yesButton.innerText = 'Yes';
                    yesButton.style.fontSize = '10px';
                    yesButton.style.backgroundColor = '#4CAF50';
                    yesButton.style.color = 'white';
                    yesButton.style.border = 'none';
                    yesButton.style.borderRadius = '5px';
                    yesButton.style.padding = '5px 10px';
                    yesButton.disabled = true;
                    buttonsContainer.appendChild(yesButton);
                }
                else if (chat.is_answered === true && chat.answer === false){
                    const noButton = document.createElement('button');
                    noButton.innerText = 'No';
                    noButton.style.backgroundColor = 'red';
                    noButton.style.fontSize = '10px';
                    noButton.style.color = 'white';
                    noButton.style.border = 'none';
                    noButton.style.borderRadius = '5px';
                    noButton.style.padding = '5px 10px';
                    noButton.disabled = true;
                    buttonsContainer.appendChild(noButton);
                }
                messageElement.appendChild(buttonsContainer);
            }
            else if (chat.is_ready_button == true && chat.user_id == userId) {
                console.log("is_ready_buttonnnnnnnn")
                const buttonsContainer = document.createElement('div');
                buttonsContainer.classList.add('ready-buttons');

                const readyButton = document.createElement('button');
                readyButton.innerText = 'Ready';
                readyButton.style.backgroundColor = '#00a7b3';
                readyButton.style.fontSize = '10px';
                readyButton.style.color = 'white';
                readyButton.style.border = 'none';
                readyButton.style.borderRadius = '5px';
                readyButton.style.padding = '5px 10px';
                readyButton.onclick = function() {
                    readyButton.disabled = true;
                    chatSocket.send(JSON.stringify({'content': 'ready', 'user_id': userId, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId}));
                };
                buttonsContainer.appendChild(readyButton);
                messageElement.appendChild(buttonsContainer);
            }
            chatLog.appendChild(messageElement);
            // console.log("chat.content = ", chat.content)
            lastUserId = chat.user_id; // Mettre à jour le dernier utilisateur
        });
    } catch (error) {
        fetchAlerts();
    }
}

function scrollToBottom() {
    const containerText = document.getElementById('containerText');
    containerText.scrollTop = containerText.scrollHeight;
}

function toggleOptions() {
    var optionsBubble = document.getElementById("options-bubble");
    if (optionsBubble.style.display === "block") {
        optionsBubble.style.display = "none";
    } else {
        optionsBubble.style.display = "block";
        document.addEventListener("click", function(event) {
            if (window.location.pathname === '/chat/') {
                var optionsBubble = document.getElementById("options-bubble");
                var optionsBtn = document.querySelector(".options-button");
                // Vérifie si l'élément cliqué est à l'intérieur de la bulle d'options ou du bouton
                if (optionsBubble) {
                    if (!optionsBubble.contains(event.target) && !optionsBtn.contains(event.target)) {
                        optionsBubble.style.display = "none"; // Ferme la bulle d'options
                    }
                }
            }
        });
    }
}

// function viewProfile() {
//     var optionsBubble = document.getElementById("options-bubble");
//     optionsBubble.style.display = "none"; // Ferme la bulle d'options
//     const selectedUser = document.querySelector('.user-item.clicked').dataset.userId;
// }

let receiveSocket = null;
function receivePlay(roomName, userID) {
    // const selectedUserId = document.querySelector('.user-item.clicked').dataset.userId;
    // console.log("RECEIVVVVVE userID = ", userID);
    if (receiveSocket && receiveSocket.readyState === WebSocket.OPEN) {
        receiveSocket.close();
    }
    receiveSocket = new WebSocket('wss://' + window.location.host + '/ws/invite_play/' + roomName + '/');
    receiveSocket.onopen = function(event) {
        // console.log('receiveSocket is open!');
    };
    receiveSocket.onmessage = async function(e) {
        const data = JSON.parse(e.data);
        if (data.content === "invite_yes") {
            // console.log('SHE SAID YESSS!!!');
            // receiveSocket.close();
            receiveSocket.send(JSON.stringify({'content': 'is_ready', 'user_id': userID, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId }));

            // launchGameInvitation(roomName, userID);
        }
        else if (data.content === "invite_no") {
            receiveSocket.close();
        }
        else if (data.content === "disconnected") {
            // console.log('DISCO RECEIVVVVVE');
            // loadMessages(roomName, userID)
            receiveSocket.close();
        }
        else {
            receiveSocket.close();
        }
    }
    receiveSocket.onclose = function(e) {
        console.log('receiveSocket socket closed');
    };
}

let inviteSocket = null;
function inviteToPlay() {
    const userID = JSON.parse(document.getElementById('user_id').textContent);
    console.log("INVIIIIIIIITE userID = ", userID);

    var optionsBubble = document.getElementById("options-bubble");
    optionsBubble.style.display = "none"; // Ferme la bulle d'options
    // selectedUserId = document.querySelector('.user-item.clicked').dataset.userId;
    let selectedUsers = [{ id: selectedUserId }];
    selectedUsers.push({ id: userID });
    const sortedUserIDs = selectedUsers.map(user => user.id).sort((a, b) => a - b);
    const roomName = sortedUserIDs.join('_');
    
    // if (inviteSocket && inviteSocket.readyState === WebSocket.OPEN) {
    //     inviteSocket.close();
    // }
    inviteSocket = new WebSocket('wss://' + window.location.host + '/ws/invite_play/' + roomName + '/');
    inviteSocket.onopen = function(event) {
        console.log('inviteSocket is open!');
        inviteSocket.send(JSON.stringify({'content': 'invite_message', 'user_id': userID, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId }));
    };
    inviteSocket.onmessage = async function(e) {
        const data = JSON.parse(e.data);
        if (data.content === "invite_yes") {
            console.log('SHE SAID YESSS!!!');
            // console.log("selectedUserId = ", selectedUserId, " userID = ", userID, " roomName = ", roomName);
            // inviteSocket.send(JSON.stringify({'content': 'is_ready', 'user_id': userID, 'selectedUserId': selectedUserId, 'otherUserID': selectedUserId }));
            // inviteSocket.close();
            // launchGameInvitation(roomName, userID);
        }
        else if (data.content === "invite_no") {
            console.log('nooo');
            inviteSocket.close();
        }
        else if (data.content === "Already_exists") {
            console.log("Already_exists");
            fetchAlerts('Sorry, you already send an invitation to this person');
            // inviteSocket.close();
        }
        else if (data.content === "Already_exists_in_other_room") {
            console.log("Already_exists_in_other_room");
            fetchAlerts('Sorry, you already send an invitation to someone else');
            inviteSocket.close();
        }
        else if (data.content === "Already_in_tournament") {
            console.log("Already_in_tournament");
            fetchAlerts('Sorry, user already in tournament');
            inviteSocket.close();
        }
        else if (data.content === "blocked_by") {
            console.log("blocked_by");
            fetchAlerts('Sorry, you can invite this user...');
            inviteSocket.close();
        }
        else if (data.content === "is_blocked") {
            console.log("is_blocked");
            fetchAlerts('Sorry, you can invite a user you blocked...');
            inviteSocket.close();
        }
        // else {
        //     console.log('other');
        //     inviteSocket.close();
        // }
    }
    inviteSocket.onclose = function(e) {
        console.log('inviteSocket socket closed');
    };
}

const handleGroupSelectionChange = (selectedUsers, group_name) => {
    // Créer un tableau pour stocker les utilisateurs sélectionnés
    const selectedUsersData = [];
    var userInfos = document.getElementById("user-infos");
    if (userInfos) {
        userInfos.innerHTML = '';
    }

    // Parcourir chaque utilisateur sélectionné
    selectedUsers.forEach(async user => {
        const selectedUserIdtmp = user.id;
        const selectedUserName = user.username;
        const selectedUserProfile = user.profile;
        const selectedUserStatus = user.profile.status;
    
        var userNameDiv = document.createElement('div');
        userNameDiv.style.display = 'flex';
        userNameDiv.style.alignItems = 'center';
        userNameDiv.style.marginBottom = '10px'; // Ajouter un peu d'espacement entre les utilisateurs
    
        // Créer un conteneur pour l'avatar et la pastille de statut
        const avatarContainer = document.createElement('div');
        avatarContainer.style.position = 'relative';
        avatarContainer.style.display = 'flex'; // Utiliser flex pour l'alignement
        avatarContainer.style.alignItems = 'center'; // Centrer verticalement
        avatarContainer.style.justifyContent = 'center'; // Centrer horizontalement
        avatarContainer.style.width = '50px';
        avatarContainer.style.height = '50px';
        avatarContainer.style.marginRight = '10px'; // Espacement entre l'avatar et le nom
    
        if (user.members_avatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = user.members_avatar;
            avatarImg.alt = 'Avatar';
            avatarImg.style.width = '100%';
            avatarImg.style.height = '100%';
            avatarImg.style.borderRadius = '50%';
            avatarContainer.appendChild(avatarImg);
        } else {
            const icon = document.createElement('i');
            icon.className = 'bi bi-person-circle';
            icon.style.fontSize = '3rem';
            icon.style.color = 'black';
            icon.style.width = '100%';
            icon.style.height = '100%';
            icon.style.display = 'flex'; // Utiliser flex pour l'alignement
            icon.style.alignItems = 'center'; // Centrer verticalement
            icon.style.justifyContent = 'center'; // Centrer horizontalement
            avatarContainer.appendChild(icon);
        }
    
        // Ajouter le cercle de statut
        const statusCircle = document.createElement('div');
        statusCircle.style.width = '15px';
        statusCircle.style.height = '15px';
        statusCircle.style.borderRadius = '50%';
        statusCircle.style.position = 'absolute';
        statusCircle.style.bottom = '-9px';
        statusCircle.style.right = '16px';
        statusCircle.style.border = '2px solid white';
    
        var status = user.members_status;
        var statusColor;
        if (status === 'active') {
            statusColor = 'green';
        } else if (status === 'inactive') {
            statusColor = 'red';
        } else if (status == 'in_game') {
            statusColor = '#ffc107';
        } else {
            statusColor = 'red';
        }

        statusCircle.style.backgroundColor = statusColor;
        avatarContainer.appendChild(statusCircle);

        userNameDiv.appendChild(avatarContainer);

        // Ajouter le nom de l'utilisateur
        var userNameDisplay = document.createElement('span');
        userNameDisplay.textContent = selectedUserName;
        userNameDisplay.style.paddingRight = '10px';
        userNameDiv.appendChild(userNameDisplay);

        userInfos.appendChild(userNameDiv);

        // Ajouter les informations de l'utilisateur au tableau
        selectedUsersData.push({ id: selectedUserIdtmp, username: selectedUserName, profile: selectedUserProfile , status : selectedUserStatus});
    });

    // Appeler les fonctions addUserName et initMessage avec le tableau complet des utilisateurs sélectionnés
    var userNameElement = document.querySelector('#selected-user-name');
    // Supprimer les éléments précédents
    userNameElement.innerHTML = '';
    var userList = document.createElement('ul');
    userList.classList.add('user-list');

    var userContainer = document.createElement('div');
    userContainer.classList.add('user-container'); // Ajouter une classe pour le style flex
    userContainer.style.display = "flex";
    userContainer.style.alignItems = "center";
    
    // Si l'utilisateur n'a pas d'avatar, vous pouvez ajouter une icône par défaut
    var iconContainer = document.createElement('div');
    iconContainer.style.width = "60px"; // Définir la largeur à 60 pixels
    iconContainer.style.height = "60px"; // Définir la hauteur à 60 pixels
    iconContainer.style.display = "flex";
    iconContainer.style.alignItems = "center";
    iconContainer.style.justifyContent = "center";
    iconContainer.style.padding = "10px";
    
    // var icon = document.createElement('i');
    const icon = document.createElement('i');
    icon.className = 'fas fa-users';
    icon.style.fontSize = '40px';
    icon.style.color = 'black';    
    iconContainer.appendChild(icon);
    userContainer.appendChild(iconContainer);
    var userName = document.createElement('span');
    userName.textContent = group_name;
    userName.style.marginLeft = "10px";
    userContainer.appendChild(userName);
    userNameElement.appendChild(userContainer);



    initMessage(selectedUsersData, group_name);
};

async function addProfileToDOM(profile, selectedUser, myId) {
    // console.log("profile = ", profile);
    // console.log("selectedUser = ", selectedUser);
    const friends_status = await fetch('/friend_status/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({'user_id': myId, 'selectedUserId': selectedUser[0].id }),
    });
    const data = await friends_status.json();
    // console.log("data = ", data);
    const friendStatus = data.status;
    // console.log("friendStatus w/ ", selectedUser[0].username, " = ", friendStatus);

    const container_friends = document.getElementById('user-list-friends');
    const container_not_friends = document.getElementById('user-list-not-friends');
    
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.dataset.userId = myId;
    userItem.dataset.username = profile.username;
    userItem.dataset.profile = JSON.stringify(profile);
    userItem.style.display = 'flex';
    userItem.style.alignItems = 'center';
    userItem.style.marginBottom = '10px';

    if (profile.avatar) {
        const avatarImg = document.createElement('img');
        avatarImg.src = profile.avatar;
        avatarImg.alt = 'Avatar';
        avatarImg.style.width = '30px';
        avatarImg.style.height = '30px';
        avatarImg.style.borderRadius = '50%';
        userItem.appendChild(avatarImg);
    } else {
        const icon = document.createElement('i');
        icon.className = 'bi bi-person-circle';
        icon.style.fontSize = '2rem';
        icon.style.color = 'black';
        userItem.appendChild(icon);
    }

    const usernameSpan = document.createElement('span');
    usernameSpan.style.color = 'black';
    usernameSpan.style.marginLeft = '10px';
    usernameSpan.style.wordBreak = 'break-all';
    usernameSpan.textContent = profile.username;

    userItem.appendChild(usernameSpan);
    // console.log("userItem = ", userItem);
    if (friendStatus === 'friends') {
        document.getElementById('title-friends').style.display = "block";
        container_friends.appendChild(userItem);
    } else {
        document.getElementById('title-other').style.display = "block";
        container_not_friends.appendChild(userItem);
    }

    // Ajout de l'événement de clic à l'élément userItem (si nécessaire)
    userItem.addEventListener('click', () => {
        // if (askFriendSocket && askFriendSocket.readyState === WebSocket.OPEN)
        //     askFriendSocket.close();
        console.log("Clicked on User")
        userItem.classList.add('clicked');
        document.getElementById("options-button").style.display = "block"
        handleSelectionChange(selectedUser, 0);
    });
}

const handleSelectionChange = (selectedUsers, boolGroup) => {
    // Créer un tableau pour stocker les utilisateurs sélectionnés
    const selectedUsersData = [];
    
    // Parcourir chaque utilisateur sélectionné
    selectedUsers.forEach(user => {
        const selectedUserIdtmp = user.id;
        const selectedUserName = user.username;
        const selectedUserProfile = user.profile;
        
        // Ajouter les informations de l'utilisateur au tableau
        selectedUsersData.push({ id: selectedUserIdtmp, username: selectedUserName, profile: selectedUserProfile });
    });

    // Appeler les fonctions addUserName et initMessage avec le tableau complet des utilisateurs sélectionnés
    addUserName(selectedUsersData);
    initMessage(selectedUsersData, "");
};

function addGroupToDOM(group, selectedUsersDisplay) {
    // const container = document.getElementById('user-list');
    const container_groups = document.getElementById('user-list-groups');
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    groupItem.dataset.type = 'group';
    groupItem.dataset.id = group.id;
    groupItem.dataset.groupName = group.name;
    groupItem.style.display = 'flex';
    groupItem.style.alignItems = 'center';
    groupItem.style.marginBottom = '10px';

    const icon = document.createElement('i');
    icon.className = 'fas fa-users';
    icon.style.fontSize = '1.5rem';
    icon.style.color = 'black';

    const groupNameSpan = document.createElement('span');
    groupNameSpan.style.color = 'black';
    groupNameSpan.style.marginLeft = '10px';
    groupNameSpan.style.wordBreak = 'break-all';
    groupNameSpan.textContent = group.group_name;

    groupItem.appendChild(icon);
    groupItem.appendChild(groupNameSpan);
    document.getElementById('title-groups').style.display = "block";
    container_groups.appendChild(groupItem);
    // Ajout de l'événement de clic à l'élément groupItem
    groupItem.addEventListener('click', () => {
        console.log("Clicked on GROUP")
        document.getElementById("options-button").style.display = "none"
        handleGroupSelectionChange(selectedUsersDisplay, group.group_name);
    });
}

function handleImageError(image) {
    image.style.display = 'none'; // Hide the broken image
    document.getElementById('avatar-icon').style.display = 'flex'; // Show the icon
}

const makeGroup = async () => {
    const userId = document.getElementById('user_id').textContent;

    // Supprimer toute ancienne modale avant d'en créer une nouvelle
    var existingModal = document.querySelector('.modal.custom-modal'); // Assurez-vous que vous ciblez la bonne modal
    if (existingModal) {
        existingModal.remove();
    }

    // Requête fetch pour récupérer les utilisateurs depuis votre backend Django
    try {
        const response = await fetch(`/user/${userId}/chat/get_users/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();

        // Créer une liste d'utilisateurs avec des cases à cocher
        var userList = document.createElement('ul');
        users.forEach(function(user) {
            var listItem = document.createElement('div');
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.value = user.id;
            var label = document.createElement('label');
            label.textContent = user.username;
            label.style.marginLeft = '5px';
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            userList.appendChild(listItem);
        });

        // Style pour la liste d'utilisateurs
        userList.style.border = '0.5px solid gray';  
        userList.style.borderRadius = '5px';  
        userList.style.padding = '10px';
        userList.style.maxHeight = '200px';  
        userList.style.overflowY = 'scroll';  

        // Créer le champ de saisie pour le nom du groupe
        var groupNameInput = document.createElement('input');
        groupNameInput.type = 'text';
        groupNameInput.placeholder = await translate ('Name of the group');
        groupNameInput.id = 'group-name-input';
        groupNameInput.style.marginBottom = '20px';  
        groupNameInput.style.width = '100%';  
        groupNameInput.style.padding = '10px';  
        groupNameInput.style.borderRadius = '5px';  
        groupNameInput.style.border = '0.5px solid gray';

        groupNameInput.addEventListener('focus', function() {
            groupNameInput.style.border = '2px solid blue';
        });

        // Événement blur : lorsque l'utilisateur clique en dehors de l'input
        groupNameInput.addEventListener('blur', function() {
            groupNameInput.style.border = '0.5px solid gray'
        });

        // Créer le bouton "Valider"
        var validateButton = document.createElement('button');
        validateButton.textContent = await translate('Create');
        validateButton.style.padding = '10px 20px';
        validateButton.style.borderRadius = '5px';
        validateButton.style.border = 'none';
        validateButton.style.backgroundColor = '#4CAF50';
        validateButton.style.color = 'white';
        validateButton.style.cursor = 'pointer';

        // Créer le bouton "Annuler"
        var cancelButton = document.createElement('button');
        cancelButton.textContent = await translate('Cancel');
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.border = '0.5px solid gray';
        cancelButton.style.background = 'none';
        cancelButton.style.color = 'black';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.marginRight = '10px';
        cancelButton.onclick = function() {
            modal.style.display = "none";
        };

        // Afficher la liste des utilisateurs dans une boîte de dialogue modale
        var modal = document.createElement('div');
        modal.className = 'modal custom-modal'; // Ajouter une classe unique pour la modal créée dynamiquement
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        var modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.padding = '20px';
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.borderRadius = '10px';
        modalContent.style.border = '1px solid #888';
        modalContent.style.boxShadow = '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '600px';
        modalContent.style.height = '350px';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';

        var modalTitle = document.createElement('div');
        modalTitle.textContent = await translate('Group Creation'); 
        modalTitle.style.flex = '1';
        modalTitle.style.fontSize = '24px';
        modalTitle.style.fontWeight = 'bold';
        modalTitle.style.textAlign = 'left';

        var closeButton = document.createElement('span');
        closeButton.className = 'close';
        closeButton.innerHTML = '&times;';
        closeButton.style.cursor = 'pointer';
        closeButton.style.alignSelf = 'flex-end';

        // Taille et position pour faire une croix centrée dans un cercle
        closeButton.style.fontSize = '24px';
        closeButton.style.width = '40px';
        closeButton.style.height = '40px';
        closeButton.style.lineHeight = '40px'; // Pour centrer verticalement
        closeButton.style.textAlign = 'center'; // Pour centrer horizontalement

        closeButton.style.backgroundColor = 'rgba(128, 128, 128, 0.1)'; // Opacité de 0.1 pour une transparence plus élevée
        closeButton.style.color = 'black';
        closeButton.style.borderRadius = '50%'; // pour en faire un cercle
        closeButton.onclick = function() {
            modal.style.display = "none";
        };

        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.id = 'error-message';
        errorMessageDiv.style.color = 'red';
        errorMessageDiv.style.display = 'none';

        var buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = 'auto';
        buttonContainer.style.textAlign = 'right'; 
        buttonContainer.appendChild(cancelButton); // ajout du bouton annuler
        buttonContainer.appendChild(validateButton);

        // Ajouter les éléments dans le bon ordre
        modalContent.appendChild(closeButton);
        modalContent.appendChild(modalTitle); 
        modalContent.appendChild(groupNameInput);  
        modalContent.appendChild(userList);
        modalContent.appendChild(errorMessageDiv);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        modal.style.display = "flex";

        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Dans la fonction de validation après avoir récupéré les ID des utilisateurs sélectionnés
        validateButton.onclick = async function() {
            var groupName = document.getElementById('group-name-input').value;
            if (groupName.trim() === '') {
                fetchAlerts('The group name can not be empty.', 'warning');
                return;
            }
            const selectedUsers = [];
            const checkboxes = document.querySelectorAll('input[type=checkbox]:checked');
            checkboxes.forEach(checkbox => {
                selectedUsers.push({
                    id: parseInt(checkbox.value),
                    username: checkbox.nextSibling.textContent.trim()
                });
            });
            if (selectedUsers.length > 1) {
                const selectedUsersbis = selectedUsers.concat();
                selectedUsersbis.push({ id: userId });

                socketMakeGroup = new WebSocket('wss://' + window.location.host + '/ws/get_group/');
                socketMakeGroup.onopen = function(event) {
                    const data = { message: 'make_group', name: groupName, members: selectedUsersbis, groupName: groupName };
                    socketMakeGroup.send(JSON.stringify(data));
                };

                socketMakeGroup.onmessage = async function(event) {
                    var data = JSON.parse(event.data);
                    if (data.content === "Wrong_name") {
                        errorMessageDiv.textContent =  await translate('Group name not accepted');
                        errorMessageDiv.style.display = 'block';
                    } else if (data.content === "Already_exists") {
                        errorMessageDiv.textContent =  await translate('A group with this name already exists');
                        errorMessageDiv.style.display = 'block';
                    } else if (data.content === "Already_members") {
                        errorMessageDiv.textContent =  await translate('Group with these members already exists');
                        errorMessageDiv.style.display = 'block';
                    } else {
                        modal.style.display = "none";
                        socketMakeGroup.close();
                    }
                };

                socketMakeGroup.onclose = function(event) {};

                socketMakeGroup.onerror = function(error) {
                    console.error('socketMakeGroup error observed:', error);
                };

            } else {
                fetchAlerts('Please select at least two users.', 'warning');
            }
        };
    } catch (error) {
        fetchAlerts();
    }
};


function blockUser() {
    var optionsBubble = document.getElementById("options-bubble");
    optionsBubble.style.display = "none"; // Ferme la bulle d'options
    const blocked_user_id = selectedUserId;
    const user_id = document.getElementById('user_id').textContent;

    let roomName_real = null;
    let result = user_id.localeCompare(blocked_user_id);
    if (result <= 0) {
        roomName_real = user_id + "_" + blocked_user_id;
    } else {
        roomName_real = blocked_user_id + "_" + user_id;
    }


    const roomName = user_id + "/" + blocked_user_id;
    
    // Envoi du message via WebSocket pour signaler le blocage de l'utilisateur
    const blockSocket = new WebSocket(
        'wss://'
        + window.location.host
        + '/ws/chat/block/'
        + roomName
        + '/'
    );
    // console.log("roomName:", roomName);
    
    blockSocket.onopen = function(e) {
        // console.log('blockSocket is open!');
        blockSocket.send(JSON.stringify({
            'type': 'block_user',
            'user_id': user_id,
            'blocked_user_id': blocked_user_id,
            'roomName_real': roomName_real,
        }));
    };

    blockSocket.onmessage = async function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'block_user_confirmation') {
            var blockButton = document.getElementById('block-btn');
            blockButton.textContent = await translate('Unblock user');
            blockButton.onclick = unblockUser;
        }
        if (data.delete_message) {
            loadMessages(roomName_real, selectedUserId);
        } 
        blockSocket.close();
    };

    blockSocket.onclose = function(e) {
        // console.log('blockSocket connection closed');
    };
}

function unblockUser() {
    var optionsBubble = document.getElementById("options-bubble");
    optionsBubble.style.display = "none"; // Ferme la bulle d'options
    const blocked_user_id = selectedUserId;
    const user_id = document.getElementById('user_id').textContent;
    const roomName = user_id + "/" + blocked_user_id;

    let roomName_real = null;
    let result = user_id.localeCompare(blocked_user_id);
    if (result <= 0) {
        roomName_real = user_id + "_" + blocked_user_id;
    } else {
        roomName_real = blocked_user_id + "_" + user_id;
    }

    // Envoi du message via WebSocket pour signaler le blocage de l'utilisateur
    const unblockSocket = new WebSocket(
        'wss://'
        + window.location.host
        + '/ws/chat/unblock/'
        + roomName
        + '/'
    );
    // console.log("roomName:", roomName);
    
    unblockSocket.onopen = function(e) {
        // console.log('unblockSocket is open!');
        unblockSocket.send(JSON.stringify({
            'type': 'unblock_user',
            'user_id': user_id,
            'blocked_user_id': blocked_user_id,
            'roomName_real': roomName_real,
        }));
    };

    unblockSocket.onmessage = async function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'unblock_user_confirmation') {
            var blockButton = document.getElementById('block-btn');
            blockButton.textContent = await translate('Block user');
            blockButton.onclick = blockUser;
        }
        unblockSocket.close();
    };

    unblockSocket.onclose = function(e) {
        // console.log('unblockSocket connection closed');
    };
}

// Fonction pour récupérer le jeton CSRF depuis les cookies
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Chercher le jeton CSRF
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
