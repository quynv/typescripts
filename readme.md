# `ExpressJS`とは
> サーバーサイドJavaScriptのNode.jsのWebアプリケーションフレームワークである _--wikipedia_

## 特徴
- 高速、柔軟、最小限のウェブフレームワーク。
- 様々な`npm`パケージに提供されています。
## NodeJSのHTTPモジュールからExpressJSのルートまで
- NodeJSのHTTPサーバーモジュールはHTTP（Hyper Text Transfer Protocol）メソドでデータを送信し、受信するというモジュールです。HTTPの様々な機能をサポートできるように設計がされます。
  - 簡単なサンプルコード：サーバーが3000ポートで動いています。
  
    ```javascript
    const http = require("http");
    const server = http.createServer();
    const callback = function(request, response) {
        response.writeHead(200, {
          "Content-Type": "text/plain"
        });
        response.end("Hello world!\n");
    };
    server.on("request", callback);
    server.listen(3000);
    ```
  `http://localhost:3000`にアクセスしたら`Hello world!`ストリングをもらえます。
- リクエスト処理の方法:
  上のコードを見たら、毎回サーバーがリクエストを受けると、`callback`関数が実行されます。なので`callback`みたいな関数はリクエスト処理が可能になります。\
  だが色々な処理ならどうするんか。幸いにもNodeJSの`EventEmit`クラスがその問題を解決できます。`EventEmit`は`EventEmit.emit()`を呼び出して`EventEmit.on()`の処理をアタッチするクラスです。
  `ExpressJS`のコードも同じです。
  ```javascript
  function createApplication() {
    var app = function(req, res, next) {
      app.handle(req, res, next);
    };

    mixin(app, EventEmitter.prototype, false);
    mixin(app, proto, false);

    // expose the prototype that will get set on requests
    app.request = Object.create(req, {
      app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    // expose the prototype that will get set on responses
    app.response = Object.create(res, {
      app: { configurable: true, enumerable: true, writable: true, value: app }
    })

    app.init();
    return app;
  } 
  ```
  `app`変数は`EventEmitter`の継承です。サーバーがリクエストを受ける時
  ```javascript
  function(req, res, next) {
      // 処理
   };
  ```
  みたいなハンドルで処理します。
  `ExpressJS`に上みたいな関数は`Middleware`と呼ばれます。
- `ExpressJS`の`Middleware`:
  `Middleware`関数は要求オブジェクト、応答オブジェクト、次のミドルウェアの関数に対する権限を持つ関数です。\
  `ExpressJS`におけるスタックで一連のミドルウェアを保存します。`next()`関数を実行する時スタック内の次のミドルウェアを呼び出します。\
  次の例はミドルウェアをバインドするケースです。
  - アプリケーションレベルのミドルウェア：
    ```javascript
    const express = require("express");
    const app = express();
    app.use(function(req, res, next) {
        // 処理
        next();
    });
    ```
    [アプリケーションレベルのAPI](http://expressjs.com/en/4x/api.html#app)
  - エラー処理ミドルウェア：
    ```javascript
    app.use(function(err, req, res, next) {
        // エラー処理
    });
    ```
  - ルートレベルのミドルウェア：
    ```javascript
    const app = express();
    const router = express.Router();
    
    router.get("/index/", function(req, res, next) {
        res.render("index");
    })
    app.use(router);

    ```
    [ルートのAPI](http://expressjs.com/en/4x/api.html#router)
  - サードパーティのミドルウェア：
    ```javascript
    const csurf = require('csurf');
    const express = require("express");
    const app = express();
    app.use(cookieParser());

    ```
  
  
# `ExpressJS` + `Typescript`
 以下は弊社のひとつの利用方法です。
 `Typescript`が[`Decorator`](http://www.typescriptlang.org/docs/handbook/decorators.html)でルートとかミドルウェアなどをバインドします。
 まず`Decorator`を作成します。
 ```typescript
    export class Router {
        public static get(path: string): MethodDecorator {
            return (target: Function, key: string, descriptor: TypedPropertyDescriptor<any>) => {
                this.defineMethod(Method.GET, path, descriptor.value);
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
            Reflect.defineMetadata(METHOD_METADATA, metadata, target); //　TypescriptのReflectでメソドの`metadata`を保存する
        }
    }
 ```
 `Decorator`を利用し方。
 ```typescript
    import { Router } from "../../vendor/router";

    export class HomeController {
        constructor() {
        }
        @Router.get("/")
        @Router.get("/index")
        public async index(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
            return res.json({
                message: "Hello world"
            });
        }
    }

 ```
 ルートのミドルウェアをハインドします。
 ```typescript
    export class Route {
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
 ```
 

