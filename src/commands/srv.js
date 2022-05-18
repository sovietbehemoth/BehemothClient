import fetch from 'node-fetch';
import { term } from "../keys/KeyHandler.js";



async function API_srv(ctx, msg) {

    if (msg[0] === "-help") {
        ctx.Keys.displayMessage("srv: Select servers.\nWithout a flag, this command will select a server given its number, ID, or name. It will allow for the chn command to access its channels. The '>' character can also be supplied followed by a channel's number, ID, or name (of course given that the channel is in the server).\n  o: Unselect server.\n  ls: List all servers.\n  lsn: Update server list.");
        return;
    }

    if (msg[0] === "-o") {
        ctx.Meta.SelectedServer = undefined;
        return;
    }

    if (msg[0] === "-ls" || msg[0] === "-lsn") {
        const url = "https://discord.com/api/v9/users/@me/guilds";
        const res = await fetch(url, { 
            headers: ctx.HTTP_Header
        });
            
        const parsed = JSON.parse(await res.text());
        
        if (msg[0] === "-ls") {
            for (let i = 0; i < parsed.length; i++) {
                const guild = parsed[i];
                ctx.Keys.displayMessage(`\t${i}: ${guild.id}: ${guild.name}`);
            }
        }

        ctx.Meta.Servers = parsed;
        // console.log();
        return;
    }    

    let guild;
    let channel = "";

    if (msg.join("").trim().includes(">")) {
        guild = msg.join("").trim().split(">")[0];
        channel = msg.join("").trim().split(">")[1]
    } else {
        guild = msg.join(" ").trim();
    }

    if (parseInt(guild) <= 50) {
        if (ctx.Meta.Servers[parseInt(guild)] !== undefined) {
            ctx.Meta.SelectedServer = ctx.Meta.Servers[parseInt(guild)].id;
            if (channel === "") {
                ctx.invokeCommand("chn", ["-ls"]);
            } else {
                ctx.invokeCommand("chn", ["-lsn"]).then(() => {
                    ctx.invokeCommand("chn", [channel.trim()]);
                });
            }
            return;
        } else {
            ctx.Keys.displayMessage(`~srv: Cannot find server with index of ${parseInt(guild)}.`);
        }
    } else if (isNaN(parseInt(guild))) {
        const search = guild.toLowerCase().trim();
        for (let i = 0; i < ctx.Meta.Servers.length; i++) {
            if (ctx.Meta.Servers[i].name.toLowerCase().trim() === search) {
                ctx.Meta.SelectedServer = ctx.Meta.Servers[i].id;
                if (channel === "") {
                    ctx.invokeCommand("chn", ["-ls"]);
                } else {
                    ctx.invokeCommand("chn", ["-lsn"]).then(() => {
                        ctx.invokeCommand("chn", [channel.trim()]);
                    });
                }
                return;
            }
        }
        ctx.Keys.displayMessage(`~srv: Cannot find server with the name of '${guild}'.`);
    } else {
        for (let i = 0; i < ctx.Meta.Servers.length; i++) {
            if (guild.trim() === ctx.Meta.Servers[i].id) {
                ctx.Meta.SelectedServer = ctx.Meta.Servers[i].id;
                if (channel === "") {
                    ctx.invokeCommand("chn", ["-ls"]);
                } else {
                    ctx.invokeCommand("chn", ["-lsn"]).then(() => {
                        ctx.invokeCommand("chn", [channel.trim()]);
                    });
                }
                return;
            }
        }
        ctx.Keys.displayMessage(`~srv: Cannot find server with the id of '${guild.trim()}'.`);
    }

}


export default API_srv;