import Avalanche from "avalanche";
import { getEnv } from "../../../env";

let avalanche: Avalanche;

export const avalancheClient = () => {
  if (!avalanche) {
    const node = `${getEnv("API_AVALANCHE_NODE")}`;

    avalanche = new Avalanche(node, 443, "https", 1);
  }

  return avalanche;
};
