const h1 = document.querySelectorAll("h1");

const toPage = url => window.location.href = url;

document.addEventListener('DOMContentLoaded', () => {
 
 h1.forEach((el) =>{
el.classList.add("grotesk-heading");
});
  
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);


  // Add a click event on each of them
  $navbarBurgers.forEach( elem => {
    el = elem;
    elem.addEventListener('click', () => {

      // Get the target from the "data-target" attribute
     let targett = elem.dataset.target;
     target = document.getElementById(targett);

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      elem.classList.toggle('is-active');
      target.classList.toggle('is-active');

    });
  });



});