function clickOutsideHandler_username(event) {
    const clickedElement = event.target;
    if (clickedElement && (clickedElement.id === "username_chip" || clickedElement.closest("#username_chip"))) {
        document.removeEventListener("mousedown", clickOutsideHandler_username);
        changeUsername('send');
    } else if (clickedElement && (clickedElement.id === "input_box" || clickedElement.closest("#input_box"))) {
        return;
    } else if (clickedElement && (clickedElement.id === "cross" || clickedElement.closest("#cross"))) {
        return;
    } else {
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.removeEventListener("mousedown", clickOutsideHandler_username);
    }
}

const changeUsername = async (status) => {
    if (status == "modify") {
        let inputElement = document.createElement("input");
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("id", "input_box");
        inputElement.setAttribute("placeholder", await translate("Username"));
        inputElement.maxLength = 20;
        
        let usernameDiv = document.getElementById("username");
        usernameDiv.innerHTML = "";
        usernameDiv.appendChild(inputElement);
        inputElement.focus();
        
        document.getElementById("input_box").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.removeEventListener("mousedown", clickOutsideHandler_username);
                changeUsername('send');
            }
        });

        document.removeEventListener("mousedown", clickOutsideHandler_username);
        document.addEventListener("mousedown", clickOutsideHandler_username);

        html = ' \
        <span id="username_chip" class="badge rounded-circle p-2" style="font-size: 1rem;"> \
            <i class="bi bi-check2-circle"></i> \
        </span>';
        document.getElementById("div_username_chip").innerHTML = html;
    } else if (status == "send") {
        let newUsername = document.getElementById("input_box").value;
        try {
            const id = await pullIdFromBack();
            const response = await fetch('/changeUsername/' + id + '/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ username: newUsername })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                fetchAlerts("The username is not valid or already used.", "warning");
                changeUsername('modify');
            }
        } catch (error) {
            fetchAlerts();
            changeUsername('modify');
        }
    }
}

function clickOutsideHandler_email(event) {
    const clickedElement = event.target;
    if (clickedElement && (clickedElement.id === "email_chip" || clickedElement.closest("#email_chip"))) {
        document.removeEventListener("mousedown", clickOutsideHandler_email);
        changeEmail('send');
    } else if (clickedElement && (clickedElement.id === "input_box" || clickedElement.closest("#input_box"))) {
        return;
    } else if (clickedElement && (clickedElement.id === "cross" || clickedElement.closest("#cross"))) {
        return;
    } else {
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.removeEventListener("mousedown", clickOutsideHandler_email);
    }
}

const changeEmail = async (status) => {
    if (status == "modify") {
        let inputElement = document.createElement("input");
        inputElement.setAttribute("type", "email");
        inputElement.setAttribute("id", "input_box");
        inputElement.setAttribute("placeholder", await translate("Email"));
        
        let emailDiv = document.getElementById("email");
        emailDiv.innerHTML = "";
        emailDiv.appendChild(inputElement);
        inputElement.focus();
        
        document.getElementById("input_box").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.removeEventListener("mousedown", clickOutsideHandler_email);
                changeEmail('send');
            }
        });

        document.removeEventListener("mousedown", clickOutsideHandler_email);
        document.addEventListener("mousedown", clickOutsideHandler_email);

        html = ' \
        <span id="email_chip" class="badge rounded-circle p-2" style="font-size: 1rem;"> \
            <i class="bi bi-check2-circle"></i> \
        </span>';
        document.getElementById("div_email_chip").innerHTML = html;
    } else if (status == "send") {
        try {
            let newEmail = document.getElementById("input_box").value;
            const response = await fetch('/changeEmail/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ email: newEmail })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                fetchAlerts("The email is not valid or already used.", "warning");
                changeEmail('modify');
            }
        } catch (error) {
            fetchAlerts();
            changeEmail('modify');
        }
    }
}

function clickOutsideHandler_bio(event) {
    const clickedElement = event.target;
    if (clickedElement && (clickedElement.id === "bio_chip" || clickedElement.closest("#bio_chip"))) {
        document.removeEventListener("mousedown", clickOutsideHandler_bio);
        changeBio('send');
    } else if (clickedElement && (clickedElement.id === "input_box" || clickedElement.closest("#input_box"))) {
        return
    } else {
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.removeEventListener("mousedown", clickOutsideHandler_bio);
    }
}

const changeBio = async (status) => {
    if (status == "modify") {
        let inputElement = document.createElement("input");
        inputElement.setAttribute("type", "text");
        inputElement.setAttribute("id", "input_box");
        inputElement.style.width = "500px";
        inputElement.style.height = "100px";
        inputElement.maxLength = 300;
        
        let bioDiv = document.getElementById("bio");
        bioDiv.innerHTML = "";
        bioDiv.appendChild(inputElement);
        inputElement.focus();
        
        document.getElementById("input_box").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.removeEventListener("mousedown", clickOutsideHandler_bio);
                changeBio('send');
            }
        });

        document.removeEventListener("mousedown", clickOutsideHandler_bio);
        document.addEventListener("mousedown", clickOutsideHandler_bio);

        html = ' \
        <span id="bio_chip" class="badge rounded-circle p-2" style="font-size: 1rem;"> \
            <i class="bi bi-check2-circle"></i> \
        </span>';
        document.getElementById("div_bio_chip").innerHTML = html;
    } else if (status == "send") {
        try {
            let newBio = document.getElementById("input_box").value;
            const response = await fetch('/changeBio/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ bio: newBio })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            console.log('data :', data.success);
            if (data.success) {
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                fetchAlerts("You entered wrong caracteres. The bio could not be changed", "warning");
                changeBio('modify');
            }
            window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (error) {
            fetchAlerts();
            changeBio('modify');
        }
    }
}

function clickOutsideHandler_pwd(event) {
    const clickedElement = event.target;
    if (clickedElement && (clickedElement.id === "pwd_chip" || clickedElement.closest("#pwd_chip"))) {
        document.removeEventListener("mousedown", clickOutsideHandler_pwd);
        changePwd('send');
    } else if (clickedElement && (clickedElement.id === "input_box" || clickedElement.closest("#input_box"))) {
        return;
    } else if (clickedElement && (clickedElement.id === "cross" || clickedElement.closest("#cross"))) {
        return;
    } else {
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.removeEventListener("mousedown", clickOutsideHandler_pwd);
    }
}

const changePwd = async (status) => {
    if (status == "modify") {
        let inputElement = document.createElement("input");
        inputElement.setAttribute("type", "password");
        inputElement.setAttribute("id", "input_box");
        inputElement.setAttribute("placeholder", await translate("Password"));
        
        let pwdDiv = document.getElementById("pwd");
        pwdDiv.innerHTML = "";
        pwdDiv.appendChild(inputElement);
        inputElement.focus();
        
        document.getElementById("input_box").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                document.removeEventListener("mousedown", clickOutsideHandler_pwd);
                changePwd('send');
            }
        });

        document.removeEventListener("mousedown", clickOutsideHandler_pwd);
        document.addEventListener("mousedown", clickOutsideHandler_pwd);

        html = ' \
        <span id="pwd_chip" class="badge rounded-circle p-2" style="font-size: 1rem;"> \
            <i class="bi bi-check2-circle"></i> \
        </span>';
        document.getElementById("div_pwd_chip").innerHTML = html;
    } else if (status == "send") {
        try {
            let newPwd = document.getElementById("input_box").value;
            const response = await fetch('/changePswrd/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ mdp: newPwd })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                fetchAlerts("The password is too weak (8 chars, 1 digit, 1 capital, 1 lowercase, 1 special char)", "warning");
                changePwd('modify');
            }
        } catch (error) {
            fetchAlerts();
            changePwd('modify');
        }
    }
}

const openFileUploader = () => {
    const fileUploader = document.getElementById('fileUploader');
    fileUploader.click();
    // const openFileUploader = () => {
    //     document.getElementById('fileUploader').click();
    //     document.getElementById('div_photo_chip').innerHTML = '<i id="saveButton" class="fas fa-cloud-upload-alt" style="font-size: 24px; cursor: pointer; padding-left: 100px;" onclick="changePhotoProfile()"></i>';
    // }
    document.getElementById('div_photo_chip').innerHTML = '<button id="ImageCancelButton" class="custom-cancel-button" onclick="CancelProfilePicture()">&times;</button> <i id="saveButton" class="fas fa-cloud-upload-alt" style="font-size: 24px; cursor: pointer; padding-left: 100px;" onclick="changePhotoProfile()"></i>';

    fileUploader.addEventListener('change', function handleFileSelect() {
        if (fileUploader.files.length === 0) {
            const saveButton = document.getElementById('saveButton');
            const cancelButton = document.getElementById('ImageCancelButton');
            if (saveButton) {
                saveButton.remove();
                cancelButton.remove();
            }
        }
        fileUploader.removeEventListener('change', handleFileSelect);
    });
}

const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
        const avatarImage = document.getElementById('avatarImage');
        avatarImage.src = URL.createObjectURL(selectedFile);
        avatarImage.style.display = 'block';
        icon = document.getElementById('avatarIcon');
        if (icon && icon.style.display != 'none') {
            icon.style.display = 'none';
        }
    }
}

async function CancelProfilePicture() {
    const avatarImage = document.getElementById('avatarImage');
    const id = await pullIdFromBack();
    try {
        const response = await fetch('/getProfile/' + id + '/', {
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
        const data = await response.json();
        const profil = JSON.parse(data.profil);
        if (profil.avatar) {
            avatarImage.src = profil.avatar;
        }
        document.getElementById("div_photo_chip").innerHTML = '';
    } catch (error) {
        fetchAlerts();
    }
}

const changePhotoProfile = async () => {
    const selectedFile = document.getElementById("fileUploader").files[0];
    if (!selectedFile) {
        fetchAlerts("No file selected. Please select a file.");
        return;
    }
    try {
        let formData = new FormData();
        console.log("selected file", selectedFile);
        formData.append("avatar", selectedFile);
        formData.append("is_avatar", false);
        const response = await fetch('/change_avatar/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        console.log(response.ok);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const avatarImage = document.getElementById('avatarImage');
        avatarImage.src = URL.createObjectURL(selectedFile);
        avatarImage.style.display = 'block';
        document.getElementById("div_photo_chip").innerHTML = '';
    } catch (error) {
        console.log("ERREUR");
        fetchAlerts();
    }
}

async function changeImageCards() {

}

async function openAvatarChoices() {
    document.querySelector('#modif-avatar button').style.display = "none";

    const avatarImages = document.querySelectorAll("#avatar-choices img");
    avatarImages.forEach(function(image) {
        image.classList.remove("selected");
    });

    document.getElementById("avatar-choices").style.display = "flex";

    avatarImages.forEach(function(image) {
        image.addEventListener("click", function() {
            avatarImages.forEach(function(img) {
                img.classList.remove("selected");
            });
            this.classList.add("selected");
        });
    });

    // if (!socketPhoto || socketPhoto.readyState !== WebSocket.OPEN) {
    //     socketPhoto = new WebSocket(
    //         'wss://'
    //         + window.location.host
    //         + '/ws/ProfilePhotoConsumer/'
    //     );
    //     console.log('socketPhoto created');
    // }
    // socketPhoto.onopen = function(event) {
    //     console.log('socketPhoto is open!');
    //     // socketPhoto.send(JSON.stringify({message : 'new_user', tournament_name: tournament_name, userId: userId}));
    // };
    
    const submitButton = document.getElementById("submit-avatar");
    const newButton = submitButton.cloneNode(true);
    submitButton.parentNode.replaceChild(newButton, submitButton);
    newButton.addEventListener("click", async function(event) {
        const selectedImage = document.querySelector("#avatar-choices img.selected");
        try {
            if (selectedImage) {
                document.getElementById("avatar-choices").style.display = "none";
                let formData = new FormData();
                formData.append("avatar", selectedImage.src);
                formData.append("is_avatar", true);
                const response = await fetch('/change_avatar/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                data = await response.json();
                const icon = document.getElementById('avatarIcon');
                icon.style.display = 'none';
                const avatarImage = document.getElementById('avatarImage');
                const timestamp = new Date().getTime();
                console.log("data.src", data.src);
                avatarImage.src = data.src + '?' + timestamp;
                avatarImage.style.display = 'block';
                document.querySelector('#modif-avatar button').style.display = "flex";

                // socketPhoto.send(JSON.stringify({ 'message': 'Profile picture changed'}));
                // if (socketPhoto && socketPhoto.readyState === WebSocket.OPEN) {
                //     console.log("socketPhoto.readyState = ", socketPhoto.readyState)
                //     socketPhoto.onmessage = function(e) {
                //         const data = JSON.parse(e.data);
                //         console.log("data.content = ", data.message)
                //     }
                // }
            } else {
                fetchAlerts("No avatar selected. Please select an avatar.");
            }
        } catch (error) {
            fetchAlerts("Sorry, the avatar could not be changed. ", "danger");
        }
    });

    const AvatarCancelButton = document.getElementById("cancel-avatar");
    const newButton2 = AvatarCancelButton.cloneNode(true);
    AvatarCancelButton.parentNode.replaceChild(newButton2, AvatarCancelButton);
    newButton2.addEventListener("click", async function(event) {
        const selectedImage = document.querySelector("#avatar-choices img.selected");
        if (selectedImage) {
            selectedImage.classList.remove("selected");
        }
        document.getElementById("avatar-choices").style.display = "none";
        document.querySelector('#modif-avatar button').style.display = "flex";
    });
}

async function deleteAvatar() {
    str = "Are you sure you want to put the icon back ?";
    str = await translate(str);
    if (str === null || str === undefined) {
        str = "Are you sure you want to put the icon back ?";
    }
    if (confirm(str)) {
        try {
            const response = await fetch('/delete_avatar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            icon = document.getElementById('avatarIcon');
            if (icon) {
                icon.style.display = 'block';

            }
            avatarImage = document.getElementById('avatarImage');
            if (avatarImage) {
                avatarImage.style.display = 'none';
            }
        } catch (error) {
            fetchAlerts();
        }
    }
}

async function showQRCode() {
    
} 