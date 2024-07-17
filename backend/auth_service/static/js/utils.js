function isUserLogged() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith('sessionid=')) {
            return true;
        }
    }
    return false;
}

function getCookie(name) {
    console.error("getCookie");
    var cookieValue = null;
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = cookie.substring(name.length + 1);
                console.log("cookieValue : " + cookieValue);
                return cookieValue;
            }
        }
    }
    return null;
}

function generateRoute(path, id) {
    var route = routes_logged[path];
    if (route) {
        route = route.replace('<int:id>', id);
        return route;
    } else {
        return null;
    }
}

async function generateGameRoute(path, gameId) {
    const id = await pullIdFromBack()
        var route = routes_logged[path];
        if (route) {
            route = route.replace('<int:gameId>', gameId);
            route = route.replace('<int:id>', id);
            return route;
        } else {
            return null;
        }
}

async function generateTournamentRoute(path, tournament_name) {
    const id = await pullIdFromBack()
        var route = routes_logged[path];
        if (route) {
            route = route.replace('<int:id>', id);
            route = route.replace('<str:tournament_name>', tournament_name);
            return route;
        } else {
            return null;
        }
}

const pullIdFromBack = async () => {
    var user_id = null;
    var sessionId = getCookie('sessionid');
    try {
        const response = await fetch('/extractId/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest',
                'Authorization': 'Bearer ' + sessionId
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success === true) {
            user_id = data.user_id;
            return user_id;
        }
        return null;
    } catch (error) {
        return null;
    }
    
}

async function getProfile() {
    const id = await pullIdFromBack();
    if (id === null)
        return null;
    try {
        const response = await fetch('/statusActive/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!response.ok) {
            fetchAlerts();
        }
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
        const profil = JSON.parse(data.profil)
        return profil;
    } catch (error) {
        return null;
    }
} 

function showLoading() {
    html = '<span>Loading...</span>';
    const pageHeight = document.documentElement.scrollHeight;
    const pageWidth = document.documentElement.scrollWidth;
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.style.display = 'flex';
    loading.style.justifyContent = 'center';
    loading.style.alignItems = 'center';
    loading.style.position = 'absolute';
    loading.style.top = '0';
    loading.style.left = '0';
    loading.style.height = pageHeight + 'px';
    loading.style.width = pageWidth + 'px';
    loading.style.backgroundColor = 'black';
    loading.style.color = 'white';
    loading.style.fontFamily = 'Tomorrow', 'sans-serif';
    loading.style.opacity = '0.5';
    loading.style.fontSize = '4em';
    loading.innerHTML = html;
    document.getElementById("app").appendChild(loading);
}

function hideLoading() {
    if (document.getElementById("loading"))
        document.getElementById("loading").remove();
}

async function fetchAlerts(message, type = 'danger') {
    if (message === null || message === undefined) {
        profile = await getProfile();
        if (profile && profile.logged_in === true) {
            str1 = translations[profile.language]['Sorry, an error occured.'];
            str2 = translations[profile.language]['Homepage'];
            if (str1 && str2)
                message = str1 + '<a href="/user/" class="alert-link">' + str2 + '</a>'
            else
                message = 'Sorry, an error occured.<a href="/user/" class="alert-link">Homepage</a>'
        } else {
            message = 'Sorry, an error occured.<a href="/" class="alert-link">Homepage</a>'
        }
    } else {
        profile = await getProfile();
        if (profile) {
            str3 = translations[profile.language][message];
            if (str3 === undefined)
                message = message;
            else
                message = str3;
        }
    }
    html = '<div class="alert alert-' + type + ' alert-dismissible fade show text-center" role="alert" id="alert" style="display: none; width: 300px; height: 50px; font-size: 12px; position: relative;"> \
        ' + message + ' \
        <button id="cross" type="button" class="btn-close" aria-label="Close"></button> \
        </div>';
    document.getElementById('fetch-alert').innerHTML = html;

    var alert = document.getElementById('alert');
    alert.style.display = 'flex';
    alert.style.alignItems = 'center';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.left = '20px';
    alert.style.zIndex = '9999';
    alert.classList.add('alert-show');

    setTimeout(function(){
        alert.classList.remove('alert-show');
        alert.classList.add('alert-hide');
        hideLoading();
        alert.addEventListener('animationend', function() {
            alert.style.display = 'none';
        }, {once: true});
    }, 4000);

    const closeButton = alert.querySelector('.btn-close');
    closeButton.addEventListener('click', function() {
        alert.classList.remove('alert-show');
        alert.classList.add('alert-hide');
        hideLoading();
        alert.addEventListener('animationend', function() {
            alert.style.display = 'none';                                                                                                            
        }, {once: true});
    });
}

function preventLinks() {
    document.querySelectorAll('a').forEach(link => {
        str = 'https://api.intra.42.fr/oauth/authorize';
        if (!link.href.startsWith(str)) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const path = this.getAttribute('href');
                updateURLAndHistory(path);
            });
        }
    });
}

function preventChangeLanguage() {
    document.querySelectorAll('.lang').forEach(button => {
        button.addEventListener('click', async function() {
            try {
                const lang = this.dataset.lang;
                const response = await fetch('/changeLang/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ lang: lang })
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                window.dispatchEvent(new PopStateEvent('popstate'));
            } catch (error) {
                fetchAlerts('Sorry, the language could not be changed.');
            }
        });
    });
}

async function translatePage() {
    profile = await getProfile();
    if (!profile || profile.logged_in === false)
        return;
    try {
        const response = await fetch('/getLang/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        const lang = data.lang;
        const textElements = document.querySelectorAll('.translate');
        textElements.forEach(function(element) {
            const text = element.textContent.trim();
            if (translations[lang][text])
                element.textContent = translations[lang][text];
            
        });
    } catch (error) {
        fetchAlerts('Sorry, this page could not be translated.');
    }
}

async function translate(toTranslate) {
    profile = await getProfile();
    if (profile.logged_in === false)
        return null;
    try {
        const response = await fetch('/getLang/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        const lang = data.lang;
        str = translations[lang][toTranslate];
        if (str)
            return str;
        else
            return toTranslate;
    } catch (error) {
        return null;
    }
}


function superviseAll() {
    preventLinks();
    preventChangeLanguage();
    translatePage();
}