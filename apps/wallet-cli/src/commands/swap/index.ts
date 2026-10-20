import { defineGroup } from "@bunli/core";
import ExecuteCommand from "./execute";
import QuoteCommand from "./quote";
import StatusCommand from "./status";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "swap",
  description: commandDescription("swap"),
  commands: [ExecuteCommand, QuoteCommand, StatusCommand],
});
