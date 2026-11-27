import "../live-common-setup";
import { createCommandOutput } from "../output";
import { getCliProcessExitCode } from "../cli-process-exit-error";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";

const out = createCommandOutput("human", { command: "account discover", network: "ethereum" });
const socketClosed = Object.assign(new Error("Socket is closed"), {
  config: { url: "https://explorers.api.live.ledger.com/blockchain/v4/eth/block/current" },
});

try {
  await out.run(async () => {
    throw WalletCliDeviceError.fromUnknown(
      new Error("UnexpectedGetBalanceError", { cause: socketClosed }),
    );
  });
} catch (e) {
  const code = getCliProcessExitCode(e);
  if (code === null) throw e;
  process.exitCode = code;
}
