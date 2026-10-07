import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import IntentsCommand from "./intents";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";
import StatusCommand from "./status";
import SendCommand from "./send";
import SyncCommand from "./sync";

export default defineGroup({
  name: "agent-intent",
  description:
    "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments for human " +
    "review, list the intents they proposed and check their status, and sync their Ledger Sync accounts.",
  commands: [
    EnrollCommand,
    RecoverCommand,
    ListCommand,
    ShowCommand,
    SendCommand,
    IntentsCommand,
    StatusCommand,
    SyncCommand,
  ],
});
