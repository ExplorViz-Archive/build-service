import {Router} from "express";
import * as fs from "fs-extra";
import * as path from "path";

export const StaticRouter: Router = Router();

StaticRouter.get("/extensions", (req, res) => {
    const extensions = fs.readJsonSync(path.join(__dirname, "../../extensionList.json"));
    res.send(extensions);
});

StaticRouter.get("/img/:imgUrl", (req, res) => {
    res.sendFile(path.join(__dirname, `../public/img/${req.params.imgUrl}`));
});
