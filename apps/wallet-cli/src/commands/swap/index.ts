import { defineGroup } from "@bunli/core";
import ExecuteCommand from "./execute";
import QuoteCommand from "./quote";
import StatusCommand from "./status";

export default defineGroup({
  name: "swap",
  description: "Swap-related commands",
  commands: [ExecuteCommand, QuoteCommand, StatusCommand],
});
