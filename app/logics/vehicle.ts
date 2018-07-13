import { Engine, EngineStatus } from "./engine";

export class Vehicle {
    constructor(
        private engine: Engine
    ) { }

    public getVehicle() {
        if (this.engine.getEngineStatus() === EngineStatus.Idle) {
            return "Vehicle is ready";
        } else {
            return "Vehicle is busy";
        }
    }
}