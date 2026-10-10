import { defineGroup } from "@bunli/core";
import ViewCommand from "./view";
import ResetCommand from "./reset";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "session",
  description: commandDescription("session"),
  commands: [ViewCommand, ResetCommand],
});
