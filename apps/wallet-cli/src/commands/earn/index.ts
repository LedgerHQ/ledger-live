import { defineGroup } from "@bunli/core";
import YieldsCommand from "./yields";
import PositionsCommand from "./positions";
import DepositCommand from "./deposit";
import WithdrawCommand from "./withdraw";
import { commandDescription } from "../registry";

export default defineGroup({
  name: "earn",
  description: commandDescription("earn"),
  commands: [YieldsCommand, PositionsCommand, DepositCommand, WithdrawCommand],
});
