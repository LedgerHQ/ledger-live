import { getEnv } from "@ledgerhq/live-env";
import { Chain, Transport, createPublicClient, http, webSocket } from "viem";
import { polygon, sepolia } from "viem/chains";

const PROJECT_ID = getEnv("AA_ZERODEV_PROJECTID");

const BUNDLER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`;
const PAYMASTER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`;

const PROJECT_ID_POLYGON = getEnv("AA_ZERODEV_PROJECTID_POLYGON");
const BUNDLER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_POLYGON}`;
const PAYMASTER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_POLYGON}`;

const publicClientSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_SEPOLIA),
});

const publicClientPolygon = createPublicClient({
  transport: http(BUNDLER_RPC_POLYGON),
});

export type ChainsSupported = "ethereum_sepolia" | "polygon";
interface ChainData {
    chain: Chain;
    name: ChainsSupported;
    cryptoCurrencyId: string;
    readableName: string;
    id: number;
    rpc: Transport;
    zerodev: {
        projectId: string;
        bundler: string;
        paymaster: string;
    },
    hasWeightedEcdsaValidator: boolean;
    explorer: string;
    blockScoutName: string;
    client: any;
}
type ChainsData = Record<ChainsSupported, ChainData>

// name = id of currencies
export const chains: ChainsData = {
  ethereum_sepolia: {
    chain: sepolia,
    name: "ethereum_sepolia",
    readableName: "Ethereum Sepolia",
    cryptoCurrencyId: "ethereum",
    id: sepolia.id, // Number
    rpc: webSocket("wss://ethereum-sepolia-rpc.publicnode.com"),
    // http(sepolia.rpcUrls.default.http[0]),
    // http("https://eth-sepolia.g.alchemy.com/v2/demo")
    zerodev: {
      projectId: PROJECT_ID,
      bundler: BUNDLER_RPC_SEPOLIA,
      paymaster: PAYMASTER_RPC_SEPOLIA,
    },
    hasWeightedEcdsaValidator: true,
    explorer: sepolia.blockExplorers.default.url,
    blockScoutName: "eth-sepolia",
    client: publicClientSepolia,
  },
  polygon: {
    chain: polygon,
    name: "polygon",
    cryptoCurrencyId: "polygon",
    readableName: "Polygon",
    id: polygon.id,
    rpc: webSocket("wss://polygon.gateway.tenderly.co"),
    //polygon.rpcUrls.default.http[0],
    zerodev: {
      projectId: PROJECT_ID_POLYGON,
      bundler: BUNDLER_RPC_POLYGON,
      paymaster: PAYMASTER_RPC_POLYGON,
    },
    hasWeightedEcdsaValidator: false,
    explorer: polygon.blockExplorers.default.url,
    blockScoutName: "polygon",
    client: publicClientPolygon,
  },

};
