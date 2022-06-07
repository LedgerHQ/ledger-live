import Avalanche from "avalanche";
import { getEnv } from "../../../env";

let avalanche: Avalanche

export const avalancheClient = () => {
    if (!avalanche) {
        const node = `${getEnv("API_AVALANCHE_NODE")}`;

        const url = new URL(node);
        avalanche = new Avalanche(url.hostname, Number(url.port));
    }

    return avalanche;
} 