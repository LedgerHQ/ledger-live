import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";
import SendCommand from "./send";
import SyncCommand from "./sync";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "agent-intent",
  description: commandDescription("agent-intent"),
  commands: [EnrollCommand, RecoverCommand, ListCommand, ShowCommand, SendCommand, SyncCommand],
});
