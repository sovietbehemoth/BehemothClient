

function API_me(ctx, args) {
    const me = ctx.Settings.User.ReadOnly;

    if (args.length === 0) {
        const fmt = JSON.stringify(me, null, 2);
        ctx.Keys.displayMessage(fmt);
        return;
    }

    const field = args.slice(0).join("_");


    const info = me[`${field}`];
    
    if (info) {
        ctx.Keys.displayMessage(`${field}: ${info}`);
    } else ctx.Keys.displayMessage("~me: User info field not found.");

}

export default API_me;