var term = require( 'terminal-kit' ).terminal ;
//console.clear();
console.log("");

let i = 0;
let data_ = [];
let pinstr = 0;
let deletion = false;

function createAlert(message) {
  i++;
  
  term.saveCursor();
  term.deleteLine();
  term.nextLine();
  console.log(message);
  process.stdin.write(data_.join(""));
  term.restoreCursor();
}

function lengthof(array) {
  let counter = 0;
  for (let i2 = 0; i2 < array.length; i2++) {
    if (array[i2] !== undefined) {
      counter++
    }
  } return counter;
}

/*
function createAlert(message) {
  term.saveCursor("");
  term.nextLine(i-2);
  term.deleteLine(i-2);
  process.stdout.write(message+"\n");
  term.nextLine(i);
  process.stdin.write(data_);
  term.nextLine(i-2);
  term.restoreCursor("");
  i++;
}*/
setInterval(() => {
  while (deletion) {};
  createAlert(`!ALERT!: ${data_.length} vs ${lengthof(data_)}, INDEX ${pinstr}, ${data_.join("")}`);
}, 2000);
term.grabInput( { mouse: 'button' } ) ;
term.on( 'key' , function( key , matches , data ) {
	switch ( key )
	{
		case 'UP' :
			term.up( 1 ) ;
			break ;
		case 'DOWN' :
			term.down( 1 ) ;
			break ;
		case 'LEFT' :
			
      if (pinstr < 0) {
        pinstr = 0;
      } else {
        term.left( 1 ) ;
        pinstr--;
      }
			break ;
		case 'RIGHT' :
      pinstr++;
      if (pinstr >= lengthof(data_)+1) {
        pinstr = lengthof(data_);
        break;
      } else {
        term.right( 1 ) ;
      }
			break ;
		case 'INSERT' :
			term.insert( 1 ) ;
			break ;
		case 'DELETE' :
			term.delete( 1 ) ;
      data_ = [];
      pinstr = 0;
			break ;
		case 'ALT_DELETE' :
			term.deleteLine( 1 ) ;
			break ;
		case 'CTRL_C' :
			process.exit() ;
		case 'BACKSPACE':
      
      term.backDelete();
      
      let tmp = [];
      for (let i2 = 0; i2 < data_.length; i2++) {
        if (i2 !== pinstr-1) {
          tmp.push(data_[i2]);
        }
      } data_ = tmp;
      
      if (pinstr > 0) {
        pinstr--;
      } else if (pinstr === 0) {
        data_ = [];
      }


      break;
    case "ENTER":
      term.deleteLine();
      data_ = [];
      break;
		default:
			// Echo anything else
			term.noFormat( Buffer.isBuffer( data.code ) ? data.code : String.fromCharCode( data.code ) ) ;
      //console.log(key);
      data_.push( typeof key !== "object" ? key.toString() : "" );
      pinstr++;
      //console.log(data_);
			//console.error( require( 'string-kit' ).escape.control( data.code.toString() ) ) ;
			break ;
	}
} ) ;

term.on( 'mouse' , function( name , data ) {
	term.moveTo( data.x , data.y ) ;
} ) ;