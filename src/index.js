/*var term = require( 'terminal-kit' ).terminal;
var KeysInit = require('./keys/KeyHandler.js');
var fs = require('fs');
var DiscordClient = require('./socket/socket.js');*/

import fs from 'fs';

import BehemothClientSocket from './socket/socket.js';
import { KeyHandler } from './keys/KeyHandler.js';

import API_chn from "./commands/chn.js";
import API_srv from './commands/srv.js';
import { exec } from 'child_process';

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

    API = [];


    Initialized = false;
    SrvLS_Initial = false;
    HTTP_Header;

    Meta = {
        Servers: [],
        Channels: [],
        SelectedServer: undefined,
        SelectedChannel: undefined,
        Mode: "CMD"
    };


    buildMenuObject() {
        const terminalWidth = process.stdout.rows;

        for (let i = 0; i < terminalWidth; i++) {
            this.MenuObject += "_";
        } this.MenuObject += "\n\n";

        for (let i = 0; i < terminalWidth; i++) {
            this.MenuObject += "_";
        } this.MenuObject += "\n";

    }

    ping() {
        const play = exec(`python ../internals/sound.py ${this.Settings.NotificationSound}`);
    }












    //Serialize settings data.
    async appendInformation() {
        fs.access("./data/settings.json", fs.constants.R_OK, (err) => {
            if (err) {
                this.Keys.displayMessage("Error: Essential 'settings.json' file not found.\n");
                process.exit(1);
            }
        });
        
        const buffer = await XreadFile("./data/settings.json");

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
    newCommand(name, callback, options = {default_args: false}) {
        for (let i = 0 ; i < this.API.length; i++) {
            if (this.API[i].name === name) {
                throw new Error(`Command by the name '${this.API[i].name}' already exists.`);
            }
        }

        this.API.push({
            name: name,
            call: callback,
            options: options
        });
    }

    async invokeCommand(name, args) {
        for (let i = 0; i < this.API.length; i++) {
            if (this.API[i].name === name.trim()) {
                await this.API[i].call(this, args);
                return;
            }
        }
        throw new Error(`Command by the name '${name}' does not exist.`);
    }

    /**Appends all built-in commands to the command list. DO NOT INVOKE. */
    builtinCommandsPush() {
        this.newCommand("chn", API_chn);
        this.newCommand("srv", API_srv);
    }

    constructor() {
        this.Keys = new KeyHandler(this);
        this.builtinCommandsPush();
        this.Keys.displayMessage("Starting BehemothClient...\n");
        
        this.appendInformation().then(async () => {
            this.Socket = new BehemothClientSocket();
            await this.Socket.startSocketPub(this);
            await this.invokeCommand("srv", ["-ls"]);
        });

        
    }
}

const Client = new BehemothClient();




