#!/usr/bin/env bun
import "./init-cwd";
import { createCLI } from "@bunli/core";
import "./env-setup";
// createCLI() also tries to import .bunli/commands.gen.ts from process.cwd(); that can hang or no-op
// when cwd is not this package. init-cwd.ts fixes native builds (usb native addon + bunli cwd).
// This side-effect import registers commands in the standalone binary.
import "../.bunli/commands.gen";
import bunliConfig from "../bunli.config";
import { disposeWalletCliDmkTransportFully } from "./device/register-dmk-transport";

// Pass config explicitly so the compiled binary does not depend on cwd for bunli.config.* discovery.
const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
await cli.run();

// Release the process-wide DMK + node-usb hotplug listeners (see persistentDmk in register-dmk-transport).
// Error paths already call process.exit(1) inside bunli, so this only runs on success.
await disposeWalletCliDmkTransportFully();
process.exit(0);
