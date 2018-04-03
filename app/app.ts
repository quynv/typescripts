import * as express from "express";
import * as http from "http";
import * as path from "path";
import { Router } from "../vendor/router";

export class Application {
    private app: express.Express;
    private server: http.Server;
    private router: express.Router;

    public init(): void {
        this.app = express();
        this.router = express.Router();
        Router.resolve(path.resolve(__dirname, "controllers"), this.router);
        this.app.use(this.router);
        const port = parseInt(process.env["NODE_ENV"] || "3001");
        this.server = http.createServer(this.app);
        this.server.listen(port);
        this.server.on("error", this.error);
    }

    public error(err: Error): void {
        console.log(err);
    }
}