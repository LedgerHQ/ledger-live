import { startSandbox } from "@ledgerhq/coin-tester/sandbox";
import type { Sandbox } from "@ledgerhq/coin-tester/sandbox";
import { sandboxVersions } from "@ledgerhq/coin-tester/versions";

// What the sandbox's airdrop gives the dev account: what the devnets used to fund at genesis, in whole units
const FUNDING = 1_000_000;

/**
 * A node that coin-sandbox runs, behind the `spawn` / `kill` the scenarios always had. Its version is the CI's:
 * `COIN_SANDBOX_<NETWORK>`, read when the node is spawned.
 * `spawn` has the sandbox fund the dev account it is given, and returns the LCD of the node: the endpoint the
 * sandbox gives. The instance is removed by `kill`, which also runs on exit signals (the sandbox client hooks them too).
 */
export function sandboxNode(network: string): {
  spawn: (devAddress: string) => Promise<string>;
  kill: () => Promise<void>;
} {
  let sandbox: Sandbox | undefined;
  return {
    spawn: async devAddress => {
      console.log(`Starting ${network} on coin-sandbox...`);
      sandbox = await startSandbox({ family: "cosmos", network }, sandboxVersions(network));
      const lcd = sandbox.endpoints.node;
      if (lcd === undefined) throw new Error("the sandbox instance has no node endpoint");
      await sandbox.airdrop(devAddress, FUNDING);
      console.log(`${network} ready`);
      return lcd;
    },
    kill: async () => {
      // The handle stays until the sandbox confirmed the removal, so that a failed `down` can be retried
      const running = sandbox;
      if (running === undefined) return;
      await running.down();
      if (sandbox === running) sandbox = undefined;
    },
  };
}
