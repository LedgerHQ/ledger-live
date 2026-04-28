#!/usr/bin/env bun
import "./embed-usb-native";
import { createCLI } from "@bunli/core";
import "./live-common-setup";
// createCLI() normally tries to import .bunli/commands.gen.ts from process.cwd() via a file:// URL.
// Our @bunli/core patch removes that dynamic import entirely because it can hang in Bun standalone
// mode, this static import registers commands instead.
// This side-effect import registers commands in the standalone binary.
import "../.bunli/commands.gen";
import bunliConfig from "../bunli.config";
import { disposeWalletCliDmkTransportFully } from "./device/register-dmk-transport";
import { WALLET_CLI_RELEASE_CHANNEL } from "./build-metadata";

if (WALLET_CLI_RELEASE_CHANNEL === "prerelease") {
  process.stderr.write(
    [
      "+----------------------------------------+",
      "|              TESTING BUILD             |",
      "|     This build is not for production   |",
      "+----------------------------------------+",
      "",
    ].join("\n"),
  );
}

// Pass config explicitly so the compiled binary does not depend on cwd for bunli.config.* discovery.
const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
await cli.run();

// Release the process-wide DMK + node-usb hotplug listeners (see persistentDmk in register-dmk-transport).
// Error paths already call process.exit(1) inside bunli, so this only runs on success.
await disposeWalletCliDmkTransportFully();
process.exit(0);
