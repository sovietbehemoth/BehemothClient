import fetch from 'node-fetch';
import { term } from "../keys/KeyHandler.js";

async function API_display50(ctx) {
    if (ctx.Meta.SelectedChannel === undefined) {
        return;
    }
    
    const url = `https://discord.com/api/v9/channels/${ctx.Meta.SelectedChannel}/messages?limit=50`;

    const res = await fetch(url, {
        headers: ctx.HTTP_Header
    });

    const messages = JSON.parse( await res.text() );

    if (messages.length === 0) {
        return;
    }

    for (let i = 50; i > 0; i--) {
        
        ctx.Socket.messageReceiveCallback(messages[i-1], true);
    }
}

async function API_chn(ctx, args) {

    if (ctx.Meta.SelectedServer === undefined) {
        ctx.Keys.displayMessage("~chn: No server selected.");
        return;
    }

    const nchannel = args.join(" ").trim();

    if (nchannel === "-ls" || nchannel === "-lsn") {
        const url = "https://discord.com/api/v9/guilds/" + ctx.Meta.SelectedServer + "/channels";
        const res = await fetch(url, {
            headers: ctx.HTTP_Header
        });

        const parse = JSON.parse( await res.text() );
        for (let i = 0; i < parse.length; i++) {
            const lchannel = parse[i];
            if (nchannel !== "-lsn") ctx.Keys.displayMessage(`\t${i}: ${lchannel.id}: ${lchannel.name}`);
        }

        ctx.Meta.Channels = parse;
        //console.log();
        return;
    }

    const channel = args.join(" ").trim();

    if (parseInt(channel) <= 50) {
        if (ctx.Meta.Channels[parseInt(channel)] !== undefined) {
            ctx.Meta.SelectedChannel = ctx.Meta.Channels[parseInt(channel)].id;
            ctx.Meta.Mode = "MSG";
            await API_display50(ctx);
            return;
        } else {
            ctx.Keys.displayMessage(`~chn: Cannot find channel with index of ${parseInt(channel)}:${channel}.`);
            return;
        }
    } else if (isNaN(parseInt(channel))) {
        const search = channel.toLowerCase().trim();
        for (let i = 0; i < ctx.Meta.Channels.length; i++) {
            if (ctx.Meta.Channels[i].name.toLowerCase().trim() === search) {
                ctx.Meta.SelectedChannel = ctx.Meta.Channels[i].id;
                ctx.Meta.Mode = "MSG";
                await API_display50(ctx);
                return;
            }
        }
        ctx.Keys.displayMessage(`~chn: Cannot find channel with the name of '${channel}'.`);
        return;
    } else {
        for (let i = 0; i < ctx.Meta.Channels.length; i++) {
            if (channel.trim() === ctx.Meta.Channels[i].id) {
                ctx.Meta.SelectedChannel = ctx.Meta.Channels[i].id;
                ctx.Meta.Mode = "MSG";
                await API_display50(ctx);
                return;
            }
        }
        ctx.Keys.displayMessage(`~chn: Cannot find server with the id of '${channel.trim()}'.`);
        return;
    }


    ctx.Meta.Mode = "MSG";
}




export default API_chn;