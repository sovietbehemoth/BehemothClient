


function exit(ctx, msg) {
    if (msg[0] === "-help") {
        ctx.Keys.displayMessage("exit: Exit BehemothClient.");
        return;
    }

    process.exit(0);
}


export default exit;