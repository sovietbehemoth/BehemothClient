// var clipboard = require('clipboardy');
// var term = require( 'terminal-kit' ).terminal;

import clipboard from "clipboardy";
import { term } from "../keys/KeyHandler.js";
import WebSocket from "ws";
import fetch from 'node-fetch';
import fs from 'fs';
import color from "colors";

class BehemothClientSocket {
    //Main client object superseding this class.
    Client;

    //Handle login prompt special conditions, for Keys object.
    inLoginPrompt = false;

    //Token buffer from stdin.
    tokenCache = [];

    //WebSocket client.
    WS;

    //Sequence number for gateway interaction.
    Sequences;

    //Interval object for heartbeat with gateway.
    HeartbeatInterval;

    updateUserInfo() {
        fetch(`https://discord.com/api/v9/users/@me`, {
            method: "GET",
            headers: {
                "Authorization": this.Client.Settings.User.Token,
                "Content-Type": "application/json"
            }
        }).then(async (res) => {
            if (res.status === 401) {
                this.startSocketPub(this.Client, true);
                return;
            }

            const info = JSON.parse(await res.text());

            this.Client.Settings.User.ReadOnly = info;

            fs.writeFileSync("./src/data/settings.json", JSON.stringify(this.Client.Settings, null, 2));     //write token to settings file.
        });
    }

    //Special handling for authentication prompt.
    promptLoginEvent(key, matches, data) {

        switch (key) {
            case 'BACKSPACE':
                this.tokenCache.pop();
                break;
            case 'ENTER':

                //Done with token typing.

                this.inLoginPrompt = false;
                term.deleteLine();
                this.Client.Settings.User.Token = this.tokenCache.join("");
                this.tokenCache = [];

                this.updateUserInfo();
                this.Client.invokeCommand("srv", ["-ls"]);

                
                break;


            //Treat both right click and ctrl+v as paste.
            case 'RIGHT_CLICK':
                clipboard.read().then((buffer) => {
                    for (let i = 0; i < buffer.length; i++) {
                        this.tokenCache.push(buffer[i]);
                    }
                });
                break;
            case 'CTRL_V':
                // console.log(clipboard.readSync); break;
                clipboard.read().then((buffer) => {
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

    
    //Identification with websocket.
    identifySocket(payload) {
        //Interval object.
        this.HeartbeatInterval = setInterval(() => {
            this.WS.send(JSON.stringify({
                "op": 1,
                "d": this.Sequences
            }));
        }, payload.d.heartbeat_interval);

        //Identification with gateway.
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

    async triggerTyping() {
        await fetch(`https://discord.com/api/v9/channels/${this.Client.Meta.SelectedChannel}/typing`, {
            method: "POST",
            headers: this.Client.HTTP_Header
        });
    }

    //Callback for optional handling of sent messages.
    async messageSendCallback(TextBuffer) {

        const output = TextBuffer.trim();

        if (output.startsWith("_")) {
            this.Client.invokeCommand(output.split("_")[1]?.split(" ")[0], output.split("_")[1], true);
            return;
        }

        if (output === "") {
            return;
        }


        if (output.includes(this.Client.Settings.User.Token)) {
            this.Client.Keys.displayMessage("~BehemothClient: I blocked this message because it contains your user token. Don't share this!");
            return;
        }

        fetch(`https://discord.com/api/v9/channels/${this.Client.Meta.SelectedChannel}/messages`, {
            method: "POST",
            headers: this.Client.HTTP_Header,
            body: JSON.stringify({
                "content": TextBuffer,
                "tts": false
            })
        });
    }

    //Callback for optional handling of received messages.
    messageReceiveCallback(payload, onret=false, pingable=true) {

        if (payload === undefined) return;

        if (payload?.mention_everyone && pingable) {
            this.Client.ping();
        }

        if (payload?.mentions?.length > 0) {
            payload.mentions.forEach(element => {
                if (element.id === this.Client.Settings.User.ReadOnly.id) {
                    if (pingable) this.Client.ping();

                    let server;

                    this.Client.Meta.Servers.forEach((server_) => {
                        if (server_.id === payload.guild_id) {
                            server = server_.name
                        }
                    });
                    
                    

                    this.Client.Keys.displayMessage(`${server} > ${payload.channel_id} > ${payload.author.username}#${payload.author.discriminator}: ${payload.content}`.bgYellow);
                }
            });
        }


        if (this.Client.Meta.Mode === "MSG") {
            if (payload.channel_id === this.Client.Meta.SelectedChannel) {
                let send = `${payload.author.username}#${payload.author.discriminator}: ${payload.content}`;
                //console.log(payload); process.exit();
                this.Client.Keys.displayMessage(send);
            }
        }

        
    }


    async appendID() {
        const url = "https://discord.com/api/v8/users/@me";
        const res = await fetch(url, {
            headers: this.Client.HTTP_Header,
        });

        const parse = JSON.parse( await res.text() );
        this.Client.Settings.User.ReadOnly.id = parse.id;
        fs.writeFileSync("./data/settings.json", JSON.stringify(this.Client.Settings, null, 2));
    }

    //ReadOnlyruction of socket, only to be called once.
    async initializeSocket() {
        if (this.Client.Settings.User.ReadOnly.id === "") {
            await this.appendID();
        }

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

        this.WS.onclose = async (event) => {
            switch (event.code) {
                case 4004:     
                    this.Client.Settings.User.Token = "";
                    await this.startSocketPub(this.Client, true);
            }
        }
    }

    //'constructor' to be called once.
    async startSocketPub(client, badtoken=false) {
        this.Client = client;


        if (client.Settings.User.Token === undefined || client.Settings.User?.Token === "") {
            if (badtoken) {
                this.Client.Keys.displayMessage("Incorrect user token.");
            } else if (this.Client.Settings.FirstUse) {
                this.Client.Keys.displayMessage(`You are not logged in.\n\nHow To Log In.\n\n  1. In discord, do Ctrl+Shift+I.\n  2. Paste this 'window.location.reload();' and wait about 2 seconds.\n  3. Paste this after waiting: 'copy(document.body.appendChild(document.createElement \`iframe\`).contentWindow.window.localStorage.token);'\n  4. Paste here and enter.\n`);
            } else {
                this.Client.Keys.displayMessage(`You are not logged in. Log in to use BehemothClient.\n`);
            }


            this.inLoginPrompt = true;
            process.stdout.write("Token: ");
        } else this.initializeSocket();


    }
}





export default BehemothClientSocket;