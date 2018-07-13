import { expect } from "chai";
import * as sinon from "sinon";

import { Engine, EngineStatus } from "../../app/logics/engine";
import { Vehicle } from "../../app/logics/vehicle";

describe("Test Vehicle", () => {
    let sandbox: sinon.SinonSandbox;
    let vehicle: Vehicle;
    let engine: Engine;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        engine = sandbox.createStubInstance(Engine);
        engine.getEngineStatus = (): EngineStatus => {
            return EngineStatus.Running;
        };

        vehicle = new Vehicle(engine);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("Vehicle should be busy", async () => {
        expect(vehicle.getVehicle()).to.equal("Vehicle is busy");
    });

    it("Vehicle should be ready", async () => {
        engine.getEngineStatus = (): EngineStatus => {
            return EngineStatus.Idle;
        };

        vehicle = new Vehicle(engine);
        expect(vehicle.getVehicle()).to.equal("Vehicle is ready");
    });
});
