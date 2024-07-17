// let socketPhoto = null;
let logoutSocket = null;

const logoutUser = async () => {
    if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
        socketLobbyCreator.send(JSON.stringify({message : 'logout', tournament_name: tournament_name, userId: userId}));
		socketLobbyCreator.onmessage = function(event) {
			const data = JSON.parse(event.data);
			if (data.content === 'leave_user' || data.content === 'delete_tournament') {
                console.log("TEST4")
                socketLobbyCreator.close();
			}
        }
	}

    if (socketShowTournament && socketShowTournament.readyState === WebSocket.OPEN) {
        socketShowTournament.send(JSON.stringify({message : 'logout', tournament_name: tournament_name, userId: userId}));
		socketShowTournament.onmessage = function(event) {
			const data = JSON.parse(event.data);
			if (data.content === 'success') {
                socketShowTournament.close();
			}
        }
	}

    if (logoutSocket && logoutSocket.readyState === WebSocket.OPEN) {
        logoutSocket.close();
    }

    window.history.pushState({}, "", "/");
    fetchAlerts("You have been logged out successfully.", "success");
    window.dispatchEvent(new PopStateEvent("popstate"));
};

const routes_notlogged = {
    "/": "/",
    "/login/": "/loginForm/",
    "/signup/": "/signupForm/",
    "/verify2FA/" : "/verify2FA/<int:id>/"
};

const functions = {
    "/": showHomepage,
    "/login/": showLogin,
    "/signup/": showSignup,
    "/logout/" : logoutUser,
    "/user/" : showUser,
    "/chat/" : showChat,
    "/game/" : showGame,
    "/game/pong/local/" : showLocalGame,
    "/game/pong/VSIA/" : showVSIAGame,
    "/game/pong/" : showGame,
    "/game/pong/lobby/" : showLobby,
    "/game/pong/tournament/" : showTournament,
    "/myProfile/" : showProfile,
    "/verify2FA/": show2FA,
    "oauth42": showOAuth42,
};

const routes_logged = { // besoins de l'id
    "/user/": "/user/<int:id>/homepage/",
    "/chat/": "/user/<int:id>/chat/",
    "/game/": "/user/<int:id>/game/",
    "/game/pong/local/": "/user/<int:id>/game/pong/local",
    "/game/pong/VSIA/": "/user/<int:id>/game/pong/VSIA",
    "/logout/": "/logout/<int:id>/",
    "/game/pong/": "/user/<int:id>/game/pong/<int:gameId>",
    "/game/pong/lobby/": "/user/<int:id>/game/pong/lobby/<str:tournament_name>/",
    "/game/pong/tournament/": "/user/<int:id>/game/pong/tournament/<str:tournament_name>/",
    "/myProfile/": "/user/<int:id>/myProfile/",
    "/profile/": "/user/<int:id>/profile/",
};

const deleteAccount = async () => {
    str = "Are you sure you want to delete your account ?";
    str = await translate(str);
    if (str === null || str === undefined) {
        str = "Are you sure you want to delete your account ?";
    }
    if (confirm(str)) {
        try {
            const response = await fetch('/deleteAccount/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            console.log("error : ", error);
            fetchAlerts();
        }
    }
}

const pullHtmlFromBack = async (route) => {
    // console.log("route : " + route);
    showLoading();
    try {
        const response = await fetch(route);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        // console.log("html : " + html);
        hideLoading();
        document.getElementById("app").innerHTML = html;
        if (functions[path])
            functions[path]();
    } catch (error) {
        fetchAlerts();
    }
}

async function showOAuth42() {
    const auth_code = document.getElementById('auth_code').value;
    if (auth_code)
        try {
            const response = await fetch('/request_api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({'type': 'access_token', 'auth_code': auth_code})
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            res = await response.json();
            access_token = res['access_token'];
            if (access_token) {
                const response2 = await fetch('/request_api/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({'type': 'user_info', 'access_token': access_token})
                });
                if (!response2.ok) {
                    throw new Error(`HTTP error! status: ${response2.status}`);
                }
                res2 = await response2.json();
                const response3 = await fetch('/handleOAuth42/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({'username': res2['username'], 'email': res2['email']})
                });
                if (!response3.ok) {
                    throw new Error(`HTTP error! status: ${response3.status}`);
                }
                res3 = await response3.json();
                if (res3['success'] === true) {
                    if (res3['type'] === '2fa') {
                        window.history.pushState({}, "", '/verify2FA/' + res3['user_id'] + '/');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    } else if (res3['type'] === 'login') {
                        handleLoginResponse();
                    } else if (res3['type'] === 'signup') {
                        handleSignupResponse();
                    } else {
                        window.history.pushState({}, "", '/');
                        fetchAlerts();
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                }
                else {
                    window.history.pushState({}, "", '/');
                    fetchAlerts(res3['error'], 'danger');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
            }
        } catch (error) {
            fetchAlerts();
        }
}

const handleRouting = async () => {
    path = window.location.pathname;
    isUserLogged() ? logged_in = true : logged_in = false;
    try {
        if (path.startsWith("/oauth42/")) {
            console.log("path start with: ", path);
            showOAuth42();
        }
        else if (path.startsWith("/profile/")) {
            id = path.split("/")[2];
            path = "/" + path.split("/")[1] + "/";
            const route = generateRoute(path, id);
            if (route) {
                await pullHtmlFromBack(route);
                superviseAll();
            } else {
                // error 404
                throw new Error("Route not found");
            }
        } else if (path.startsWith("/game/pong/") & !path.startsWith("/game/pong/local/") & !path.startsWith("/game/pong/lobby/") & !path.startsWith("/game/pong/tournament/") & !path.startsWith("/game/pong/VSIA/")) {
                gameId = path.split("/")[3];
                path = "/" + path.split("/")[1] + "/" + path.split("/")[2] + "/";
                try {
                    let route = await generateGameRoute(path, gameId);
                    if (route) {
                        const res = await fetch(route);
                        if (!res.ok) {
                            if (res.status == '404') {
                                fetchAlerts('You can\'t access this game or have been kicked out.', 'warning');
                                updateURLAndHistory(`/game/`);
                            }
                            throw new Error(`HTTP error! status: ${res.status}`);
                        }
                        const html = await res.text();
                        document.getElementById("app").innerHTML = html;
                        if (functions[path]) functions[path]();
                            superviseAll();
                    }
                } catch (error) {
                    console.error('Error generating game route:', error);
                }
        } else if (path.startsWith("/game/pong/lobby/")) {
            tournament_name = path.split("/")[4];
            path = "/" + path.split("/")[1] + "/" + path.split("/")[2] + "/" + path.split("/")[3] + "/";
            userId = await pullIdFromBack();
            await generateTournamentRoute(path, tournament_name).then( route => {
                if (route) {
                    fetch(route)
                    .then(data => data.text())
                    .then(html => {
                        document.getElementById("app").innerHTML = html;
                        if (functions[path])
                            functions[path](tournament_name, userId);
                        superviseAll();
                });
            }
        });
        } else if (path.startsWith("/game/pong/tournament/")) {
            tournament_name = path.split("/")[4];
            path = "/" + path.split("/")[1] + "/" + path.split("/")[2] + "/" + path.split("/")[3] + "/";
            userId = await pullIdFromBack();
            await generateTournamentRoute(path, tournament_name).then( route => {
                if (route) {
                    fetch(route)
                    .then(data => data.text())
                    .then(html => {
                        document.getElementById("app").innerHTML = html;
                        if (functions[path])
                            functions[path](tournament_name, userId);
                        superviseAll();
                });
            }
        });
        } else if (path.startsWith("/verify2FA/")) {
            if (logged_in) {
                fetchAlerts("Access forbidden", "danger");
                window.history.pushState({}, "", "/user/");
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                showLoading();
                try {
                    const response = await fetch(path);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const html = await response.text();
                    hideLoading();
                    document.getElementById("app").innerHTML = html;
                    if (functions['/verify2FA/'])
                        functions['/verify2FA/']();
                } catch (error) {
                    fetchAlerts();
                }
            }
        } else {
            if (routes_notlogged.hasOwnProperty(path) && !logged_in) {
                route = routes_notlogged[path];
                await pullHtmlFromBack(route);
            } else if (routes_logged.hasOwnProperty(path) && logged_in) {
                user_id = await pullIdFromBack();
                const route = generateRoute(path, user_id);
                if (route) {
                    await pullHtmlFromBack(route);
                    superviseAll();
                } else {
                    // error 404
                    throw new Error("Route not found");
                }
            } else if (logged_in) {
                fetchAlerts("Access forbidden", "danger");
                window.history.pushState({}, "", "/user/");
                window.dispatchEvent(new PopStateEvent('popstate')); 
            } else if (!logged_in) {
                fetchAlerts("Access forbidden", "danger");
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        }
    } catch (error) {
        fetchAlerts();
        console.error('Une erreur s\'est produite lors de la navigation :', error);
    }
}

window.addEventListener('popstate', () => {
    handleRouting();
});

function updateURLAndHistory(path) {
    window.history.pushState({ path }, null, path);
    window.dispatchEvent(new PopStateEvent("popstate"));
}

window.addEventListener('beforeunload', async function(event) {
    isUserLogged() ? logged_in = true : logged_in = false;
    try {
        if (logged_in) {
            if (logoutSocket && logoutSocket.readyState === WebSocket.OPEN) {
                await fetch('/statusInactive/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                logoutSocket.close();
            }
            // if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
            //     socketLobbyCreator.send(JSON.stringify({message : 'logout', tournament_name: tournament_name, userId: userId}));
            //     socketLobbyCreator.onmessage = function(event) {
            //         const data = JSON.parse(event.data);
        //         if (data.content === 'leave_user' || data.content === 'delete_tournament') {
        //             socketLobbyCreator.close();
        //         }
        //     }
        // }
        // if (socketShowTournament && socketShowTournament.readyState === WebSocket.OPEN) {
        //     socketShowTournament.send(JSON.stringify({message : 'logout', tournament_name: tournament_name, userId: userId}));
        //     socketShowTournament.onmessage = function(event) {
        //         const data = JSON.parse(event.data);
        //         if (data.content === 'success') {
        //             socketShowTournament.close();
        //         }
        //     }
        // }
        }
    } catch(error) {
        console.log("error : ", error);
    }
    

});

document.addEventListener('DOMContentLoaded', async function() {
    isUserLogged() ? logged_in = true : logged_in = false;
    if (logged_in) {
        if (!logoutSocket || logoutSocket.readyState !== WebSocket.OPEN) {
            logoutSocket = new WebSocket('wss://' + window.location.host + '/ws/logoutConsumer/');
            logoutSocket.onopen = function(event) {
                logoutSocket.send(JSON.stringify({'message': 'refresh'}));
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
        }
        userId = await pullIdFromBack();
        try {
            const response = await fetch(`/user/${userId}/game/is_in_lob_or_tour`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // return data.lastMessage;
            if (data.test)
            {
                console.log(data.test);
                if (socketLobbyCreator && socketLobbyCreator.readyState === WebSocket.OPEN) {
                    socketLobbyCreator.close();
                }
                if (!socketLobbyCreator || socketLobbyCreator.readyState !== WebSocket.OPEN) {
                    socketLobbyCreator = new WebSocket(`wss://${window.location.host}/ws/pong/lobby/${data.tournament_name}/`);
                    to_pop_in_tournament = true;
                    socketLobbyCreator.onopen = function(event) {
                        console.log('socketLobbyCreator is open!');
                        // socketLobbyCreator.send(JSON.stringify({message : 'new_user', tournament_name: data.tournament_name, userId: userId}));
                    };
                    socketLobbyCreator.onmessage = function(event) {
                        var dataLobby = JSON.parse(event.data);
                        // console.log("dataLobby.content = ", dataLobby.content)
                        if (dataLobby.content === 'tournament_deleted') {
                            console.log('tournament_deleted');
                            window.history.pushState({}, "", `/game/`);
                            window.dispatchEvent(new PopStateEvent("popstate"));
                            createButtonLobby();
                        }
                        else if (dataLobby.content === 'new_user') {
                            updateNbPlayers(dataLobby);
                            fillPlayersInHTML(dataLobby);
                            console.log("data.survivor_idddddd = ", dataLobby.survivor_id);
                            if (dataLobby.tournament_nb_player_direct === dataLobby.tournament_nb_player && dataLobby.survivor_id.toString() === userId.toString())
                            {
                                socketLobbyCreator.send(JSON.stringify({message : 'launch', tournament_name: data.tournament_name}));
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
                            let strFetch = "Tournament " + data.tournament_name + " launched!!"
                            fetchAlerts(strFetch, "success");
            
                            if (to_pop_in_tournament) {
                                window.history.pushState({}, "", `/game/pong/tournament/${tournament_name}`);
                                window.dispatchEvent(new PopStateEvent("popstate"));
                            }
                            createButton();
                            // if (data.userId === userId) {
                            //     console.log(userId)
                            // 	socketLobbyCreator.close();
                            // }
                            socketLobbyCreator.close();
                            launchTournament(userId, data.tournament_name, true);						
                        }
                    }
                    socketLobbyCreator.onclose = function(event) {
                        console.log('socketLobbyCreator connection closed');
                    };
                }
            }
        } catch (error) {
            console.error('Error :', error);
            fetchAlerts();
            return null;
        }
    }
});

