import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";
import SendCommand from "./send";
import SwapCommand from "./swap";
import SyncCommand from "./sync";

export default defineGroup({
  name: "agent-intent",
  description:
    "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments and swaps for " +
    "human review, and sync their Ledger Sync accounts.",
  commands: [
    EnrollCommand,
    RecoverCommand,
    ListCommand,
    ShowCommand,
    SendCommand,
    SwapCommand,
    SyncCommand,
  ],
});
