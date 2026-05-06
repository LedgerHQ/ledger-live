import { defineGroup } from "@bunli/core";
import ExecuteCommand from "./execute";
import QuoteCommand from "./quote";

export default defineGroup({
  name: "swap",
  description: "Swap-related commands",
  commands: [ExecuteCommand, QuoteCommand],
});
