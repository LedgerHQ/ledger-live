import { defineGroup } from "@bunli/core";
import EnrollCommand from "./enroll";
import ListCommand from "./list";
import RecoverCommand from "./recover";
import ShowCommand from "./show";

export default defineGroup({
  name: "agent-intent",
  description: "Enroll and manage Agent Intent profiles for AI agents proposing EVM payments.",
  commands: [EnrollCommand, RecoverCommand, ListCommand, ShowCommand],
});
