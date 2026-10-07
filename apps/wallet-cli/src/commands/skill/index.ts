import { defineGroup } from "@bunli/core";
import ListCommand from "./list";
import RetrieveCommand from "./retrieve";
import InstallCommand from "./install";
import DoctorCommand from "./doctor";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "skill",
  description: commandDescription("skill"),
  commands: [ListCommand, RetrieveCommand, InstallCommand, DoctorCommand],
});
