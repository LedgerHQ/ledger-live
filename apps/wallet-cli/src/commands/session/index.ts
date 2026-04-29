import { defineGroup } from "@bunli/core";
import ViewCommand from "./view";
import ResetCommand from "./reset";

export default defineGroup({
  name: "session",
  description: "Session management commands",
  commands: [ViewCommand, ResetCommand],
});
