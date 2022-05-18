


function API_q(ctx, args) {
    if (ctx.Meta.Mode === "MSG") {
        ctx.Meta.Mode = "CMD";
    } else {
        process.exit(0);
    }
}

export default API_q;