import Header from './components/header.js';
import Hero from './components/hero.js';
import Footer from './components/footer.js';

import { QComponent } from 'queflow';


const App = new QComponent("#app", {
  stylesheet: {
    "*": `
      font-family: Sans-serif;
      text-align: center;
    `,
    ".green": "color: #148A81",
    ".dark": "color: rgb(6,27,60);",
  },
  template: () => {
    return `
       <Header/>
       <Hero/>
       <Footer/>
    `;
  }
});


App.render();
