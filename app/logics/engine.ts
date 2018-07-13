/* istanbul ignore file */
export enum EngineStatus {
    Idle = "idle",
    Running = "running"
}

export class Engine {
    private status: EngineStatus = EngineStatus.Idle;

    public getEngineStatus(): EngineStatus {
        return this.status;
    }
}