import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import ImportCommand from "./import";
import DestroyCommand from "./destroy";

// NTTVS-728: enroll/restore Ledger Sync (device + LKRP, application id 16 — distinct from `ring`'s
// 17) and explicitly pull synchronized accounts into the local session. Separate trust model from
// both `ring` and `agent-intent`: this application never receives Agent Intent's Trustchain ID, and
// Agent Intent enrollment never receives Ledger Sync's walletSyncEncryptionKey.
export default defineGroup({
  name: "ledger-sync",
  description: "Enroll/restore Ledger Sync and import its synchronized accounts into the session.",
  commands: [EnrollCommand, ImportCommand, DestroyCommand],
});
