import {Router} from "express";
import * as fs from "fs-extra";
import fetch from "node-fetch";
import * as path from "path";

export const StaticRouter: Router = Router();

StaticRouter.get("/extensions", (req, res) => {
    const extensions = fs.readJsonSync(path.join(__dirname, "../extensionList.json"));
    res.send(extensions);
});

StaticRouter.get("/predefinedBuilds", (req, res) => {
    const extensions = fs.readJsonSync(path.join(__dirname, "../predefinedBuilds.json"));
    res.send(extensions);
});

StaticRouter.get("/img/:imgUrl?", (req, res) => {
    const exists = fs.existsSync(path.join(__dirname, `../public/img/${req.params.imgUrl}`));
    if (exists) {
        res.end(`img/${req.params.imgUrl}`);
    } else {
        fetch(`img/${req.params.imgUrl}`)
        .then(
            (success) => res.send(success),
            (error) => res.send("img/logo-default.png")
        );
    }
});
