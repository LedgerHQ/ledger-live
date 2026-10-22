import { defineGroup } from "@bunli/core";
import DiscoverCommand from "./discover";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "account",
  description: commandDescription("account"),
  commands: [DiscoverCommand],
});
