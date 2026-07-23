import { defineGroup } from "@bunli/core";
import ListCommand from "./list";
import RetrieveCommand from "./retrieve";
import InstallCommand from "./install";

export default defineGroup({
  name: "skill",
  description: "Ledger wallet-cli agent skills (list, retrieve, install)",
  commands: [ListCommand, RetrieveCommand, InstallCommand],
});
