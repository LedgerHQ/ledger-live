import { defineGroup } from "@bunli/core";
import QuoteCommand from "./quote";

export default defineGroup({
  name: "swap",
  description: "Swap-related commands",
  commands: [QuoteCommand],
});
