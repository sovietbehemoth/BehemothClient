import fetch from 'node-fetch';

async function API_status(ctx, args) {

    if (args.length === 0) {
        ctx.Keys.displayMessage(`~status: `);
    }

    if (args[0] === "idle" || args[0] === "invisible" || args[0] === "online" || args[0] === "dnd") {
        await fetch("https://discord.com/api/v9/users/@me/settings", {
            headers: ctx.HTTP_Header,
            method: "PATCH",
            body: JSON.stringify({
                "status": args[0]
            })
        });
    } else if (args[0] === "-s") {
        await fetch("https://discord.com/api/v9/users/@me/settings", {
            headers: ctx.HTTP_Header,
            method: "PATCH",
            body: JSON.stringify({
                "custom_status": {
                    "text": args.slice(1).join(" ")
                }
            })
        });
    } else {
        ctx.Keys.displayMessage("~status: Invalid status option.");
    }
} 

export default API_status;