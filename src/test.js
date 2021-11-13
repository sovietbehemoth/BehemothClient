


//
let blessed = require('blessed');

let screen = blessed.screen();
let box = new blessed.form({
  border: {
    type: "line"
  },
  bg: "grey",
  fg: "grey",
  height: "25%",
});


let isfirst = false;
let written_out = 0;

screen.on("keypress", (ch, key) => {
  if (isfirst) {
    process.stdin.write("\n   ");
  }
  if (key.full === "C-c") {
    process.exit();
  } else process.stdin.write(key.sequence);


  if (key.name === "enter") {
    for (i in 0..written_out) {
      process.stdin.write("\r");
    } 
    screen.remove(box);
    screen.destroy();
    screen = blessed.screen();
    box = new blessed.form({
      border: {
        type: "line"
      },
      bg: "grey",
      fg: "grey",
      height: "25%",
    });
    screen.append(box);
    box.focus();
    screen.render();
  }
})
box.focus();
screen.append(box);

screen.render();