import * as express from "express";
import "reflect-metadata";
import * as klawAsync from "klaw-sync";

export enum Method {
    GET = "get",
    POST = "post",
    ALL = "all"
}

export enum MiddlewareType {
    BEFORE,
    AFTER
}

export interface IMetadata {
    urls: {
        path: string;
        method: string;
    }[];
    before: express.Handler[];
    after: express.Handler[];
}

export const METHOD_METADATA = Symbol('method_meta');

export class Router {
    public static get(path: string): MethodDecorator {
        return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
            this.defineMethod(Method.GET, path, descriptor.value);
            return descriptor;
        };
    }

    public static post(path: string): MethodDecorator {
        return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
            this.defineMethod(Method.POST, path, descriptor.value);
            return descriptor;
        };
    }

    public static all(path: string): MethodDecorator {
        return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
            this.defineMethod(Method.ALL, path, descriptor.value);
            return descriptor;
        };
    }

    public static before(middleware: () => express.Handler | express.ErrorRequestHandler): MethodDecorator {
        return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
            this.defineMiddleware(MiddlewareType.BEFORE, middleware, descriptor.value);
            return descriptor;
        };
    }

    public static after(middleware: () => express.Handler | express.ErrorRequestHandler): MethodDecorator {
        return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
            this.defineMiddleware(MiddlewareType.AFTER, middleware, descriptor.value);
            return descriptor;
        };
    }

    private static defineMethod(method: Method, path: string, target: Object): void {
        let metadata: IMetadata = <IMetadata>Reflect.getMetadata(METHOD_METADATA, target);
        if (!metadata) {
            metadata = {
                urls: [],
                before: [],
                after: []
            };
        }
        metadata.urls.push({
            path: path,
            method: method
        });
        Reflect.defineMetadata(METHOD_METADATA, metadata, target);
    } 

    private static defineMiddleware(type: MiddlewareType, func: () => express.Handler | express.ErrorRequestHandler, target: Object): void {
        let metadata: IMetadata = <IMetadata>Reflect.getMetadata(METHOD_METADATA, target);
        if (!metadata) {
            metadata = {
                urls: [],
                before: [],
                after: []
            };
        }
        metadata[MiddlewareType[type].toLocaleLowerCase()].push(func);
        Reflect.defineMetadata(METHOD_METADATA, metadata, target);
    }

    public static resolve(dir: string, router: express.Router): void {
        klawAsync(dir, { nodir: true })
        .map(file => file.path)
        .filter(file => file.endsWith(".js"))
        .forEach(file => {
            const module: Object = require(file);
            const controllerContainer: string[] = [];

            Object.keys(module)
            .filter(m => m.endsWith("Controller"))
            .forEach(m => {
                if (controllerContainer.indexOf(m) !== -1) return;
                controllerContainer.push(m);
                const instance = new module[m]();
                
                Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                .filter(method => method != 'constructor')
                .forEach(method => {
                    const metadata = <IMetadata>Reflect.getMetadata(METHOD_METADATA, instance[method]);
                    const middleware = async (req, res, next) => {
                        const result = instance[method](req, res, next);
                        if (result["then"]) {
                            await result;
                        }
                    }
                    
                    metadata.urls.forEach(item => {
                        const args = [item.path, ...metadata.before, middleware, ...metadata.after];
                        router[item.method].apply(router, args);
                    });
                });
            });
        });
    }
}