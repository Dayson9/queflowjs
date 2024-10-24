const { QComponent } = QueFlow;

const styles = {
  "*": `
      text-align: center;
      display: block;
      transition: .3s;
      font-family: 'sans-serif';
  `,
  ".out": `
      font-weight: 500;
      font-size: 20px;
      color: rgb(24, 65, 70);
      `,
  "input": `
      width: 60%;
      height: 40px;
      border: none;
      background: rgba(0,0,255,0.1);
      border-radius: 5px;
      margin-left: 20%;
      outline: none;
      box-sizing: border-box;
  `,
  "input:focus": `
      outline: none;
      border: 2px solid rgba(0,55,255,0.4);
 `,

  "button": `
      width: 60%;
      height: 40px;
      border: 2px solid rgba(0, 90, 255, .1);
      background: rgba(0, 90, 255, .7);
      border-radius: 5px;
      margin-left: 20%;
      color: white;
      margin-top: 20px;
      transition: 0.3s;
 `,

  "button:active": `
      background: rgba(0, 90, 255, .86);
   `
};


const calculator = new QComponent("#app", {
  data: {
    out: 20*20
  },
  stylesheet: styles,
  template: () => {
    return (
      `
      <h1 color='dodgerblue'>Simple Calculator App</h1>
    
     <p class='out'>Output: {{ this.data.out }}</p>
     
     <input type='text' value='20*20' id='input'>
    
    <button onclick={{ eval(input.value) ? this.data.out = eval(input.value) : ''; }}>Evaluate</button>
    `
    )
  }
});

calculator.render();