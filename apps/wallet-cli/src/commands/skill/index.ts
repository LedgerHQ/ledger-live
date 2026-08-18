import { defineGroup } from "@bunli/core";
import ListCommand from "./list";
import RetrieveCommand from "./retrieve";
import InstallCommand from "./install";
import DoctorCommand from "./doctor";

export default defineGroup({
  name: "skill",
  description: "Ledger wallet-cli agent skills (list, retrieve, install, doctor)",
  commands: [ListCommand, RetrieveCommand, InstallCommand, DoctorCommand],
});
