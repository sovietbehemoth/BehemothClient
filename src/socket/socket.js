// var clipboard = require('clipboardy');
// var term = require( 'terminal-kit' ).terminal;

import clipboard from "clipboardy";
import { term } from "../keys/KeyHandler.js";
import WebSocket from "ws";
import fetch from 'node-fetch';

class BehemothClientSocket {
    Client;


    inLoginPrompt = false;
    tokenCache = [];
    WS;
    Sequences;
    HeartbeatInterval;

    promptLoginEvent(key, matches, data) {

        switch (key) {
            case 'BACKSPACE':
                this.tokenCache.pop();
                break;
            case 'ENTER':
                this.inLoginPrompt = false;
                term.deleteLine();
                this.Client.Settings.User.Token = this.tokenCache.join("");
                this.tokenCache = [];
                term.clear();
                this.initializeSocket();
                break;
            case 'RIGHT_CLICK':
                clipboard.default.readSync().then((buffer) => {
                    for (let i = 0; i < buffer.length; i++) {
                        this.tokenCache.push(buffer[i]);
                    }
                });
                break;
            case 'CTRL_V':
                clipboard.default.readSync().then((buffer) => {
                    for (let i = 0; i < buffer.length; i++) {
                        this.tokenCache.push(buffer[i]);
                    }
                });
                break;
            case 'CTRL_C':
                process.exit();
            default:
                this.tokenCache.push(key);
                break;
        }
    }

    

    identifySocket(payload) {
        this.HeartbeatInterval = setInterval(() => {
            this.WS.send(JSON.stringify({
                "op": 1,
                "d": this.Sequences
            }));
        }, payload.d.heartbeat_interval);

        this.WS.send(JSON.stringify({
            "op": 2,
            "d": {
                "token": this.Client.Settings.User.Token,
                "properties": this.Client.Settings.Identity
            }
        }));
    }



    messageCallback(payload) {
        
        switch (payload.t) {
            case "MESSAGE_CREATE":
                this.messageReceiveCallback(payload.d);
                break;
        }
    }

    eventCallback(event) {
        const payload = JSON.parse(event.data.toString());
        this.Sequences = payload.s

        

        switch (payload.op) {
            case 10:
                this.identifySocket(payload);
                break;
            case 0:
                if (payload.t === "MESSAGE_CREATE") {
                    this.messageCallback(payload);
                }
                break;
        }
    }




    messageSendCallback() {

        fetch(`https://discord.com/api/v9/channels/${this.Client.Meta.SelectedChannel}/messages`, {
            method: "POST",
            headers: this.Client.HTTP_Header,
            body: JSON.stringify({
                "content": this.Client.TextBuffer.join(""),
                "tts": false
            })
        });
    }

    messageReceiveCallback(payload, onret=false) {


        if (payload.mention_everyone) {
            this.Client.ping();
        } else if (payload.content.includes())


        if (this.Client.Meta.Mode === "MSG") {
            if (payload.channel_id === this.Client.Meta.SelectedChannel) {
                let send = `${payload.author.username}#${payload.author.discriminator}: ${payload.content}`;
                //this.Client.Keys.displayMessage(send);
                console.log(payload);
            }
        }

        
    }

    async initializeSocket() {
        this.Client.HTTP_Header = {
            'Authorization': this.Client.Settings.User.Token,
            'Content-Type': "application/json"
        };


        this.WS = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");



        this.WS.onmessage = (data) => {
            this.eventCallback(data);
        };

        this.WS.onopen = () => {
            this.Client.Initialized = true;
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
    }

    async startSocketPub(client) {
        this.Client = client;


        if (client.Settings.User.Token === undefined || client.Settings.User?.Token === "") {
            if (this.Client.Settings.FirstUse) {
                this.Client.Keys.displayMessage(`You are not logged in.\n\nHow To Log In.\n\n  1. In discord, do Ctrl+Shift+I.\n  2. Paste this 'window.location.reload();' and wait about 2 seconds.\n  3. Paste this after waiting: 'copy(document.body.appendChild(document.createElement \`iframe\`).contentWindow.window.localStorage.token);'\n  4. Paste here and enter.\n`);
            } else {
                this.Client.Keys.displayMessage(`You are not logged in. Log in to use BehemothClient.\n`);
            }


            this.inLoginPrompt = true;
            process.stdin.write("Token: ");
        } else this.initializeSocket();
    }
}





export default BehemothClientSocket;