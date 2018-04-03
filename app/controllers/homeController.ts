/// <reference path='../../typings/tsd.d.ts' />

import * as express from "express";
import { Router } from "../../vendor/router";

export class HomeController {
    constructor() {
    }
    @Router.get("/")
    @Router.get("/index")
    public async index(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
        res.json({
            message: "Hello world"
        });
    }
}