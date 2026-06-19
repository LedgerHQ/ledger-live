export * from "./runCli.js";
export * from "./cliCommandsUtils.js";

// The bundle's own registerTransportModule, so the e2e harness registers the
// Speculos transport into the instance the in-process commands resolve against.
export {
  registerTransportModule,
  unregisterAllTransportModules,
} from "@ledgerhq/live-e2e-shared/commands";
