///<reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts"/>"

export interface Promise<T> {
    timeout(ms: number, message?: string): Promise<T>;
    catch<E extends Error>(ErrorClass: new (...args: any[]) => E, onReject: (error: E) => T | PromiseLike<T>): Promise<T>;
}
