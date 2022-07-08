import Avalanche from "avalanche";
import { getEnv } from "../../../env";

let avalanche: Avalanche

export const avalancheClient = () => {
    if (!avalanche) {
        const node = `${getEnv("API_AVALANCHE_NODE")}`;

        const url = new URL(node);
        avalanche = new Avalanche(url.hostname, Number(url.port));
        avalanche.setNetworkID(1); //5 = "FUJI", 1 = MAINNET. DELETE THIS LINE IF ON MAINNET
    }

    return avalanche;
} 