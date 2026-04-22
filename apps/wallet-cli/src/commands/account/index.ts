import { defineGroup } from "@bunli/core";
import DiscoverCommand from "./discover";
import FreshAddressCommand from "./fresh-address";

export default defineGroup({
  name: "account",
  description: "Account management commands",
  commands: [DiscoverCommand, FreshAddressCommand],
});
