const { subComponent } = QueFlow;


// Styles declaration for hero UI
const styles = {
  ".container": `
      width: 100%;
      height: auto;
      padding-block: 20vh;
      padding-inline: 5%;
      box-sizing: border-box;
      margin-top: 20px;
    `,
  ".row": `
      height: auto;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
    `,
  "button": `
      width: 140px;
      height: 60px;
      border-radius: 10px;
      border: none;
      color: white;
      background: rgb(6,27,60);
      font-size: 15px;
    `,
  ".second": "background: #148A81;"
}

// Define subComponent for hero
const hero = new subComponent({
  stylesheet: styles,
  template: () => `
    <div>
      <div class='container'>
        <h1 class='dark'>
        QueFlowJS<br>The <span class='green'>Modern</span> UI Library
        </h1>
        <p class='dark'>A highly performant UI library for declaratively building web User Interfaces.</p>
        <div class='row'>
          <button>Documentation</button>
          <button class='second'>Repository</button>
        </div>
      </div>
    </div>
  `
});

export { hero }