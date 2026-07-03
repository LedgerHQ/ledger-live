import { DeviceParams } from "@ledgerhq/speculos-transport";
import { SpeculosDevice } from "./speculos";
export declare function waitForSpeculosReady(deviceId: string, { interval, timeout }?: {
    interval?: number | undefined;
    timeout?: number | undefined;
}): Promise<void>;
/**
 * Error thrown when Speculinho `/acquire` fails.
 * Carries the `run_id` so we can still fetch `/status` and `/logs`.
 */
export declare class SpeculinhoAcquireError extends Error {
    readonly runId: string;
    constructor(message: string, runId: string);
}
export declare function getSpeculinhoRunIdFromError(error: unknown): string | undefined;
export declare function createSpeculosDeviceCI(deviceParams: DeviceParams): Promise<SpeculosDevice | undefined>;
export declare function releaseSpeculosDeviceCI(runId: string): Promise<void>;
/**
 * Fetches Speculos pod stderr from Speculinho (GET /logs/{run_id}).
 * Call while the instance is still up (before POST /release).
 */
export declare function fetchSpeculinhoLogs(runId: string): Promise<string>;
/**
 * Fetches Speculinho pod status (GET /status/{run_id}).
 * Useful as extra debug on failure — surfaces pod state (Running / CrashLoopBackOff / …) and any kube-side error.
 */
export declare function fetchSpeculinhoStatus(runId: string): Promise<string>;
//# sourceMappingURL=speculosCI.d.ts.map