import "../../live-common-setup";
import { createCommandOutput } from "../../output";
import { getCliProcessExitCode } from "../../cli-process-exit-error";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";

const out = createCommandOutput("human", {
  command: "test-human-device-error-exit",
  network: "ethereum:main",
});

try {
  await out.run(async () => {
    throw new WalletCliDeviceError({ code: "timeout", likelyCause: "sandbox_blocking_usb" });
  });
} catch (e) {
  const code = getCliProcessExitCode(e);
  if (code === null) throw e;
  process.exitCode = code;
}
