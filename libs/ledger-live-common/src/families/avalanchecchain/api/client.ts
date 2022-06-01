import Avalanche from "avalanche";
import { getEnv } from "../../../env";

let client: Avalanche

export const avalancheClient = () => {
    if (!client) {
        const node = `${getEnv("API_AVALANCHE_NODE")}`;
        //todo: use getENV
        client = new Avalanche("localhost", 5555, "http");
    }

    return client;
} 