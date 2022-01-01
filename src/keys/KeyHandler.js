// var term = require( 'terminal-kit' ).terminal;
import { createRequire } from 'module';


const require = createRequire(import.meta.url);
const termkit = require("terminal-kit");

import fetch from 'node-fetch';
import clipboard from "clipboardy";

const term = termkit.createTerminal();

class KeyHandler {
    Client;

    //Left arrow event. Moves cursor left once, decrementing position.
    leftArrow = () => {
        if (this.Client.CursorIndex < 0) {
            this.Client.CursorIndex = 0;
        } else {
            term.left(1);
            this.Client.CursorIndex--;
        }
    }

    //Right arrow event. Moves cursor right once, incrementing event.
    rightArrow() {
        this.Client.CursorIndex++;
        if (this.Client.CursorIndex >= this.Client.TextBuffer.length + 1) {
            this.Client.CursorIndex = this.Client.TextBuffer.length;
        } else {
            term.right(1);
        }
    }

    //Deletes character before cursor.
    backspace() {
        term.backDelete();
        

        //Delete char indexed.
        let tmp = [];

        for (let i2 = 0; i2 < this.Client.TextBuffer.length; i2++) {
            if (i2 !== this.Client.CursorIndex - 1) {
                tmp.push(this.Client.TextBuffer[i2]);
            }
        } this.Client.TextBuffer = tmp;
      
        //Index should never precede 0.
        if (this.Client.CursorIndex > 0) {
            this.Client.CursorIndex--;
        } else if (this.Client.CursorIndex === 0) {
            this.Client.TextBuffer = [];
        }

    }

    //Submits prompt in TextBuffer.
    enter() {
        
        const input = this.Client.TextBuffer.join("");

        this.Client.TextBuffer = [];
        this.Client.CursorIndex = 0;

        if (this.Client.Meta.Mode === "CMD") {
            
            let args = [];
            let command;
            if (input.includes(" ")) {
                command = input.split(" ")[0];
                args = input.split(" ");
                args.shift();
            } else command = input;

            for (let i = 0; i < this.Client.API.length; i++) {
                if (this.Client.API[i].name === command) {
                    if (!this.Client.API[i].options.default_args && args.length === 0) {
                        this.Client.Keys.displayMessage(`~${this.Client.API[i].name}: Expected more than 0 arguments.`);
                        return;
                    }
                    this.Client.invokeCommand(command, args);
                    return;
                }
            }

            if (command.trim() === "") return;

            this.Client.Keys.displayMessage(`Could not find command by the name of '${command.trim()}'.`);
        } else if (this.Client.Meta.Mode === "MSG") {
            term.deleteLine();
            this.Client.Socket.messageSendCallback(input);
        }

        //term.deleteLine();
    }


    //Append char to TextBuffer.
    appendChar(char, data) {
        term.noFormat( Buffer.isBuffer( data.code ) ? data.code : String.fromCharCode( data.code ) ) ; //default handling.
        this.Client.TextBuffer.push( typeof char !== "object" ? char.toString() : "" ); //prevent typerrors
        this.Client.CursorIndex++; 
    }

    //Unstable cls command.
    clearScreen() {
        for (let i = this.Client.LineIndex; i > this.Client.LineIndex; i--) {
            term.deleteLine(i);
        }
    }

    //Retrieve buffer from clipboard and write to buffer and stdin.
    paste() {
        clipboard.read().then((buffer) => {
            process.stdin.write(buffer);
            for (let i = 0; i < buffer.length; i++) {
                this.Client.TextBuffer.push(buffer[i]);
            }
        });
    }

    //Main key press event handler.
    keyTriggerCallback = (key, matches, data) => {

        if (this.Client.Socket.inLoginPrompt) {
            this.Client.Socket.promptLoginEvent(key, matches, data);
            return;
        }

        switch (key) {
            case 'LEFT': 
                this.leftArrow();
                break;
            case 'RIGHT':
                this.rightArrow();
                break;
            case 'BACKSPACE':
                this.backspace();
                break;
            case 'ENTER':
                this.enter();
                break;
            case 'CTRL_V':
                this.paste();
            default:
                this.appendChar(key, data);
                break;


            case 'CTRL_C':
                process.exit();
        }
    }







    //Safe method of creating a message that will not interrupt any other fields. Use instead of console.log()
    displayMessage(message, format = undefined) {

        this.Client.LineIndex++;

        term.saveCursor();

        term.deleteLine();
        term.nextLine();
        
        if (format) {
            console.log(`%c${message}%c`, format);
        } else console.log(message);
        

        try {
            const decode = this.Client.TextBuffer.join("");

            if (decode !== "") {
                process.stdout.write(decode);
            }
        } catch {
            console.log("Error: Write failed. Re-instantiate the client and if the problem persists, report it.");
            process.exit(1);
        }

        term.restoreCursor();
    }

    //curses boilerplate. only called once.
    prepareKeyEvent() {
        term.on( 'mouse' , function( name , data ) {
            term.moveTo( data.x , data.y ) ;
        } ) ;
        term.grabInput( { mouse: 'button' } ) ;
    }



    constructor(context) {
        this.Client = context;

        //Curses boilerplate.
        term.on('key', this.keyTriggerCallback);
        this.prepareKeyEvent();
    }
}


export { KeyHandler, term };