import { ContractKit, newKit } from "@celo/contractkit";
import { getEnv } from "../../../env";

let kit: ContractKit;
export const celoKit = () => {
  if (!kit) kit = newKit(getEnv("API_CELO_NODE"));
  return kit;
};
