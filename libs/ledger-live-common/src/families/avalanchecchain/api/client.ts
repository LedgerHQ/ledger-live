import Avalanche from "avalanche";
import Web3 from "web3";
import { getEnv } from "../../../env";

let avalanche: Avalanche;
let web3: Web3;

export const avalancheClient = () => {
    if (!avalanche) {
        const node = `${getEnv("API_AVALANCHE_NODE")}`;
        const url = new URL(node);

        avalanche = new Avalanche(url.hostname, Number(url.port));
    }

    return avalanche;
};

export const web3Client = () => {
    if (!web3) {
        const node = `${getEnv("API_AVALANCHE_NODE")}`;
        web3 = new Web3(`${node}/ext/bc/C/rpc`);
    }

    return web3;
}