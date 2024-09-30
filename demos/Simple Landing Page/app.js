import { header } from './components/header.js';
import { hero } from './components/hero.js';
import { footer } from './components/footer.js';

Header = header;
Hero = hero;
Footer = footer;

const { QComponent } = QueFlow;

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