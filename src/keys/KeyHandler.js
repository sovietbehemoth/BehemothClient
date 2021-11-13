// var term = require( 'terminal-kit' ).terminal;
import { createRequire } from 'module';


const require = createRequire(import.meta.url);
const termkit = require("terminal-kit");

import fetch from 'node-fetch';
import clipboard from "clipboardy";

const term = termkit.createTerminal();

class KeyHandler {
    Client;


    leftArrow = () => {
        if (this.Client.CursorIndex < 0) {
            this.Client.CursorIndex = 0;
        } else {
            term.left(1);
            this.Client.CursorIndex--;
        }
    }

    rightArrow() {
        this.Client.CursorIndex++;
        if (this.Client.CursorIndex >= this.Client.TextBuffer.length + 1) {
            this.Client.CursorIndex = this.Client.TextBuffer.length;
        } else {
            term.right(1);
        }
    }

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

    enter() {
        
        if (this.Client.Meta.Mode === "CMD") {
            const input = this.Client.TextBuffer.join("");
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
                }
            }
        } else if (this.Client.Meta.Mode === "MSG") {
            this.Client.Socket.messageSendCallback(this.Client.TextBuffer.join(""));
        }

        term.deleteLine();
        this.Client.TextBuffer = [];
    }



    appendChar(char, data) {
        term.noFormat( Buffer.isBuffer( data.code ) ? data.code : String.fromCharCode( data.code ) ) ; //default handling.
        this.Client.TextBuffer.push( typeof char !== "object" ? char.toString() : "" ); //prevent typerrors
        this.Client.CursorIndex++; 
    }

    clearScreen() {
        for (let i = this.Client.LineIndex; i > this.Client.LineIndex; i--) {
            term.deleteLine(i);
        }
    }

    paste() {
        clipboard.read().then((buffer) => {
            process.stdin.write(buffer);
            for (let i = 0; i < buffer.length; i++) {
                this.Client.TextBuffer.push(buffer[i]);
            }
        });
    }


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








    displayMessage(message) {

        this.Client.LineIndex++;

        term.saveCursor();

        term.deleteLine();
        term.nextLine();

        console.log(message);

        try {
            const decode = this.Client.TextBuffer.join("");

            if (decode !== "") {
                process.stdin.write(decode);
            }
        } catch {
            console.log("Error: Write failed. Re-instantiate the client and if the problem persists, report it.");
            process.exit(1);
        }

        term.restoreCursor();
    }

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