import "../../live-common-setup";
import { createCommandOutput } from "../../output";
import { WalletCliDeviceError } from "../../device/wallet-cli-device-error";

const out = createCommandOutput("human", {
  command: "test-human-device-error-exit",
  network: "ethereum:main",
});

await out.run(async () => {
  throw new WalletCliDeviceError({ code: "timeout" });
});
