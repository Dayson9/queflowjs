var target, el = {};

const pages = document.querySelectorAll(".page"), loader = document.querySelector("#loader"), h1 = document.querySelectorAll("h1");

const toPage = (id, con) =>{
let elem = document.getElementById(id), int = (Math.random()*1800)+10;

elem.style.visibility = "hidden";
elem.style.display = "none";

loader.style.display = "block";
loader.style.visibility = "visible";

let a = document.createElement("a");
a.href = "#nav";

pages.forEach((page) =>{
if(page.id != id){
page.style.display = "none";
}
});

a.click();

if(con){
el.classList.remove('is-active');
target.classList.remove('is-active');
}

setTimeout(() => {
loader.style.display = "none";
elem.style.display = "block";
elem.style.visibility = "visible";
}, int);

}



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