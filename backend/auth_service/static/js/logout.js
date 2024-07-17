function logoutOnUnload() {
  var url = '/logout/' + userId
  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    window.location.href = '/';
  })
  .catch(error => {
    console.error('Une erreur s\'est produite lors de la déconnexion :', error);
  });
}

window.addEventListener('unload', logoutOnUnload);
// function ChangeUrl() {
//   console.log("changement d'url")
//   var url = '/logout/' + userId
//   fetch(url, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   })
//   .then(response => {
//     window.location.href = '/';
//   })
//   .catch(error => {
//     console.error('Une erreur s\'est produite lors de la déconnexion :', error);
//   });
//   // recueperer le token des cookies
//   // verifier s'il existe ou pas
//   // si il existe, il peut pas aller a '/' ou '/login' ou 'signup' donc rediriger vers le home
//   // si il existe pas, il peut aller que aux page '/' ou '/login' ou 'signup' donc rediriger vers '/' 
//   // var currentUrl = window.location.href;
//   // print("Current URL : " + currentUrl);
// }

// // Écouteur d'événement pour le changement d'URL
// window.addEventListener('popstate', function(event) {
//   // Récupérer l'URL actuelle
//   var currentUrl = window.location.href;

//   print("Current URL : " + currentUrl);

//   // Envoyer une requête AJAX au backend pour signaler le changement d'URL
//   // fetch('/?url=' + encodeURIComponent(currentUrl), {
//   //     method: 'GET',
//   //     headers: {
//   //         'Content-Type': 'application/json',
//   //         // Ajoutez d'autres en-têtes si nécessaire
//   //     },
//   // })
//   // .then(response => {
//   //     // Gérer la réponse du backend si nécessaire
//   // })
//   // .catch(error => {
//   //     // Gérer les erreurs si elles se produisent
//   // });
// });
