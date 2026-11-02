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
import WaitCommand from "./wait";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "agent-intent",
  description: commandDescription("agent-intent"),
  commands: [
    EnrollCommand,
    WaitCommand,
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
