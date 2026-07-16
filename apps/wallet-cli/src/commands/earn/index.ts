import { defineGroup } from "@bunli/core";
import YieldsCommand from "./yields";
import PositionsCommand from "./positions";
import DepositCommand from "./deposit";
import WithdrawCommand from "./withdraw";

export default defineGroup({
  name: "earn",
  description: "Earn (staking & DeFi yield) commands",
  commands: [YieldsCommand, PositionsCommand, DepositCommand, WithdrawCommand],
});
