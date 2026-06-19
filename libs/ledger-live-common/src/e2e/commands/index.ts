export * from "./types";
export { ensureE2ERuntime } from "./bootstrap";
export { cmdGetAddress } from "./getAddress";
export { cmdLiveData } from "./liveData";
export { cmdTokenApproval } from "./tokenApproval";
export { cmdGetTokenAllowance } from "./tokenAllowance";

// Re-exported so the e2e harness can register a Speculos transport into THIS
// bundle's own module instance (the commands resolve the device against it).
// Keeps any DMK/device dependency on the e2e side, injected via the open fn.
export { registerTransportModule, unregisterAllTransportModules } from "../../hw/index";
