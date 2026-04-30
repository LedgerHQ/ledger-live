import { defineGroup } from "@bunli/core";
import DiscoverCommand from "./discover";

export default defineGroup({
  name: "account",
  description: "Account management commands",
  commands: [DiscoverCommand],
});
