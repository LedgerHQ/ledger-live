import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";
import SyncCommand from "./sync";

export default defineGroup({
  name: "agent-intent",
  description:
    "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments, and sync " +
    "their Ledger Sync accounts.",
  commands: [EnrollCommand, RecoverCommand, ListCommand, ShowCommand, SyncCommand],
});
