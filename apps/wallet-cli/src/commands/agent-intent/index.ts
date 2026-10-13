import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import CancelCommand from "./cancel";
import IntentsCommand from "./intents";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";
import StatusCommand from "./status";
import SendCommand from "./send";
import SwapCommand from "./swap";
import SyncCommand from "./sync";

export default defineGroup({
  name: "agent-intent",
  description:
    "Enroll and manage Agent Intent profiles for AI agents proposing Ethereum and Solana " +
    "payments and Ethereum swaps for human review, list the intents they proposed, check " +
    "their status and cancel them, and sync their Ledger Sync accounts.",
  commands: [
    EnrollCommand,
    RecoverCommand,
    ListCommand,
    ShowCommand,
    SendCommand,
    SwapCommand,
    IntentsCommand,
    StatusCommand,
    CancelCommand,
    SyncCommand,
  ],
});
