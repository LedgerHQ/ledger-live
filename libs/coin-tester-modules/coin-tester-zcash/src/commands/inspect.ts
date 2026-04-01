import type { CommandModule } from "yargs";
import { readSnapshot } from "../core/snapshot";

interface InspectArgs {
  snapshot: string;
  diff?: string;
}

export const inspectCommand: CommandModule<{}, InspectArgs> = {
  command: "inspect <snapshot>",
  describe: "Inspect or diff snapshot files.",
  builder: yargs =>
    yargs
      .positional("snapshot", {
        type: "string",
        demandOption: true,
        describe: "Path to snapshot file",
      })
      .option("diff", {
        type: "string",
        describe: "Diff against another snapshot",
      }),
  handler: async argv => {
    const snapshot = await readSnapshot(argv.snapshot);
    const m = snapshot.metadata;

    console.log("=== Snapshot Metadata ===");
    console.log(`  Label:        ${m.accountLabel}`);
    console.log(`  Network:      ${m.network}`);
    console.log(`  UFVK:         ${m.ufvkFingerprint}`);
    console.log(`  Birth Height: ${m.birthHeight}`);
    console.log(`  Height:       ${m.snapshotHeight}`);
    console.log(`  Chain Tip:    ${m.chainTipAtCapture}`);
    console.log(`  Created:      ${m.createdAt}`);
    console.log(`  Format Ver:   ${m.formatVersion}`);

    const d = snapshot.derivedData;
    console.log("\n=== Derived Data ===");
    console.log(`  Transparent Balance: ${d.transparentBalance} ZEC`);
    console.log(`  Shielded Balance:    ${d.shieldedBalance} ZEC`);
    console.log(`  Available Balance:   ${d.availableBalance} ZEC`);
    console.log(`  Operations Count:    ${d.operationsCount}`);
    console.log(`  Shielded Tx Count:   ${d.shieldedTxCount}`);
    console.log(`  Transparent Tx Count: ${d.transparentTxCount}`);

    if (argv.diff) {
      const other = await readSnapshot(argv.diff);
      console.log("\n=== Diff ===");
      const fields: (keyof typeof d)[] = [
        "shieldedBalance",
        "transparentBalance",
        "availableBalance",
        "operationsCount",
        "shieldedTxCount",
      ];
      for (const field of fields) {
        const a = String(d[field]);
        const b = String(other.derivedData[field]);
        const changed = a !== b ? " <<< CHANGED" : "";
        console.log(`  ${field}: ${a} → ${b}${changed}`);
      }
    }
  },
};
