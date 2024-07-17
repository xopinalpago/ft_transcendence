// const route = (event) => {
//   event.preventDefault();
//   window.history.pushState({}, "", event.target.href);
//   handleLocation();
// };

// const routes = {
//   "/": "/",
//   "/test/": "/test/",
//   "/test2/": "/test2/",
// };

// const handleLocation = async () => {
//   const path = window.location.pathname;
//   const route = routes[path] || routes[404];
//   const html = await fetch(route).then((data) => data.text());
//   document.getElementById("main-page").innerHTML = html;
// };

// window.onpopstate = handleLocation;
// window.route = route;

// handleLocation();

const route = (event, path) => {
  event.preventDefault();
  window.history.pushState({}, "", path);
  handleLocation();
};

const routes = {
  "/": "/",
  "/test/": "/test/",
  "/test2/": "/test2/",
  "/signup/": "/signup/",
  "/login/": "/login/",
};

const handleLocation = async () => {
  console.log("IN HANDLE LOCATION");
  const path = window.location.pathname;
  const route = routes[path] || routes[404];
  const html = await fetch(route).then((data) => data.text());
  document.getElementById("main-page").innerHTML = html;
};

window.onpopstate = handleLocation;
// window.onload = handleLocation;
window.route = route;

handleLocation();

export { handleLocation };
