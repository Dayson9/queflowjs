import { subComponent } from 'queflow';

// Styles for header UI
const styles = {
  "header": `
      width: 85%;
      height: 65px;
      background: white;
      border-radius: 15px;
      box-shadow: 2px 4px 16px rgba(0,0,0,0.1);
      position: fixed;
      top: 20px;
      left: 7.5%;
      display: flex;
      flex-direction: row;
      justify-content: space-evenly;
      align-items: center;
    `,
  "#img": `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 3px solid #148A81;
    `,
  "button": `
      width: 80px;
      height: 30px;
      border: none;
      background: rgb(6,27,60);
      color: white;
      border-radius: 10px;
    `
};


// Define header subComponent
const header = new subComponent({
  stylesheet: styles,
  template: () => `
    <div>
      <header>
        <div id='img'></div>
        <h2 class='dark'>QueFlowJS</h2>
        <button onclick='alert("Nothing to see here, just a demo...")'>View</button>
      </header>
    </div>`
});


export { header }