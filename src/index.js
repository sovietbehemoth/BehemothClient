

import BehemothClientSocket from './socket/socket.js';
import { KeyHandler, term } from './keys/KeyHandler.js';

import API_chn from "./commands/chn.js";
import API_srv from './commands/srv.js';
import API_exit from './commands/exit.js';
import API_q from "./commands/_q.js";
import API_status from "./commands/status.js";
import API_me from "./commands/me.js";

import { exec } from 'child_process';
import { stdin } from 'process';
import fs from 'fs';

//Asynchronous file read.
async function XreadFile(fileName) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf8', function (error, data) {
        if (error) {
            return reject(error);
        }
  
        resolve(data);
      })
    });
}







class BehemothClient {

    //The current message box buffer.
    TextBuffer = [];

    //Lines written to.
    LineIndex = 0;

    //Index of cursor in message box.
    CursorIndex = 0;

    MenuObject = "";
    
    //Curses library.
    Keys;

    //Settings meta data object.
    Settings;

    //Discord connection.
    Socket;

    //API functions.
    API = [];

    //Client ready.
    Initialized = false;

    //User HTTP headers to be used for HTTP requests with the API.
    HTTP_Header;

    Meta = {
        Servers: [],                    //List of servers the user is a member of.
        Channels: [],                   //List of channels in the currently indexed server.
        SelectedServer: undefined,      //Server to list channels from.
        SelectedChannel: undefined,     //Channel to receive messages from.
        Mode: "CMD",                    //Mode determines client behavior. CMD mode is without message sending.
    };

    

    //Creates a notification sound based on the sound file listed in the settings file.
    ping() {
        exec(`python ./internals/sound.py ${this.Settings.NotificationSound}`);
    }


   
   
   
   






    //Serialize settings data.
    async appendInformation() {

        //Ensure that file exists.
        fs.access("./src/data/settings.json", fs.constants.R_OK, (err) => {
            if (err) {
                this.Keys.displayMessage("Error: Essential 'settings.json' file not found.\n");
                process.exit(1);
            }
        });
        
        //Read file.
        const buffer = await XreadFile("./src/data/settings.json");

        try {
            this.Settings = await JSON.parse(buffer);
        } catch {
            this.Keys.displayMessage("Error: Malformed settings file.");
            process.exit(1);
        }

    }





    

    /**
     * Create a new command.
     * @param {*} name Name of command. The user will enter this string to trigger the command.
     * @param {*} callback (ctx, args) The callback to the command. ctx: Context to the BehemothClient class, args: Arguments to the command, split on whitespace.
     * @param {*} options Optional extra options.
    */
    newCommand(name, callback, options = {default_args: false, mode: "ANY"}) {

        //No duplicate identifiers allowed in API.
        for (let i = 0 ; i < this.API.length; i++) {
            if (this.API[i].name === name) {
                throw new Error(`Command by the name '${this.API[i].name}' already exists.`);
            }
        }

        //Append.
        this.API.push({
            name: name,
            call: callback,
            options: options
        });
    }

    /**
     * Calls command by name.
     * @param {*} name Name of command (string).
     * @param {*} args Arguments supplied to command (string[]).
     */
    async invokeCommand(name, args, nothrow = false) {
        for (let i = 0; i < this.API.length; i++) {
            if (this.API[i].name === name.trim()) {

                if (this.API[i].options.mode === "CMD" && this.Meta.Mode !== "CMD") {
                    this.Keys.displayMessage(`~BehemothClient: Command '${this.API[i].name}' is only usable at top level.`);
                    return;
                } else if (this.API[i].options.mode === "MSG" && this.Meta.Mode !== "MSG") {
                    this.Keys.displayMessage(`~BehemothClient: Command '${this.API[i].name}' is only usable in message mode.`);
                }

                await this.API[i].call(this, args);
                return;
            }
        }
        if (!nothrow) throw new Error(`Command by the name '${name}' does not exist.`);

        this.Keys.displayMessage(`~BehemothClient: Could not find command by the name of '${name}'.`);
    }

    /**Appends all built-in commands to the command list. DO NOT INVOKE. */
    builtinCommandsPush() {
        this.newCommand("chn", API_chn, {mode: "CMD"});
        this.newCommand("srv", API_srv, {mode: "CMD"});
        this.newCommand("exit", API_exit, {default_args: true});
        this.newCommand("q", API_q, {default_args: true});
        this.newCommand("status", API_status, {default_args: true});
        this.newCommand("refresh", () => this.Socket.updateUserInfo(), {default_args:true});
        this.newCommand("me", API_me, {default_args: true});
    }

    //Deliberately crashes the client, logging @message.
    createCrash(message) {
        console.log("// Uh oh, it looks like BehemothClient got mad and crashed.");
        console.log(message);
        console.log(`  PID: ${process.pid}\n  Platform: ${process.platform}`);
        process.exit(1);
    }

    //Called once internally.
    handleErrors() {
        process.stdin.on('close', (err) => {
            if (!err) {
                this.createCrash(`Stdin pipe closed.\nReadable: ${stdin.readable}\nVirtual Address: ${stdin.remoteAddress}\nWritable: ${stdin.writable}\nScan Buffer Size: ${stdin.bytesRead}\nWrite Buffer Size: ${stdin.bytesWritten}`);
            }
        });
        process.stdin.on('error', (error) => { process.pid
            this.createCrash(`Stdin failed: ${error.message}.`);
        });
        process.on('SIGABRT', () => {
            this.createCrash(`Program aborted.`);
        });
        process.on('SIGSEGV', (mem) => {
            this.createCrash(`Overload in memory usage: ${mem}`);
        });
        process.on('uncaughtException', (err) => {
            this.createCrash(`Program failure: ${err.message}`);
        });
        process.on('unhandledRejection', (err) => {
            this.createCrash(`Rejection failure: ${err}.`);
        });
    }



    constructor() {

        this.Keys = new KeyHandler(this);
        this.builtinCommandsPush();
        this.Keys.displayMessage("Starting BehemothClient...\n");
        this.handleErrors();


        this.appendInformation().then(async () => {
            this.Socket = new BehemothClientSocket();
            await this.Socket.startSocketPub(this);
            await this.invokeCommand("srv", ["-ls"]);
            process.stdout.write(this.MenuObject + '\n');
        });

        
    }
}

const Client = new BehemothClient();