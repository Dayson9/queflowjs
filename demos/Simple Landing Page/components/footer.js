import { subComponent } from 'queflow';

// Define styles for Footer UI.
const styles = {
  "footer": `
      width: 100vw;
      height: 20vh;
      background: rgb(6, 27, 60);
      box-sizing: border-box;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
  "footer > span": `
      font-size: 15px;
      font-weight: 400;
    
    `
};


// Define subComponent for footer
const Footer = new subComponent('Footer', {
  stylesheet: styles,
  template: () => `
    <div>
      <footer>
        <span>Nothing to see here, just a demo...</span>
      </footer>
    </div>
  `
});

export default Footer;