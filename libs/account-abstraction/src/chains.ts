import { getEnv } from "@ledgerhq/live-env";
import { Chain, Transport, createPublicClient, http, webSocket } from "viem";
import {
  arbitrumSepolia,
  baseSepolia,
  optimismSepolia,
  polygon,
  polygonMumbai,
  sepolia,
} from "viem/chains";

const PROJECT_ID = getEnv("AA_ZERODEV_PROJECTID");
const BUNDLER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID}`;
const PAYMASTER_RPC_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID}`;

const PROJECT_ID_POLYGON = getEnv("AA_ZERODEV_PROJECTID_POLYGON");
const BUNDLER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_POLYGON}`;
const PAYMASTER_RPC_POLYGON = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_POLYGON}`;

const PROJECT_ID_POLYGON_MUMBAI = getEnv("AA_ZERODEV_PROJECTID_POLYGON_MUMBAI");
const BUNDLER_RPC_POLYGON_MUMBAI = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_POLYGON_MUMBAI}`;
const PAYMASTER_RPC_POLYGON_MUMBAI = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_POLYGON_MUMBAI}`;

const PROJECT_ID_ARBITRUM_SEPOLIA = getEnv("AA_ZERODEV_PROJECTID_ARBITRUM_SEPOLIA");
const BUNDLER_RPC_ARBITRUM_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_ARBITRUM_SEPOLIA}`;
const PAYMASTER_RPC_ARBITRUM_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_ARBITRUM_SEPOLIA}`;

const PROJECT_ID_OPTIMISM_SEPOLIA = getEnv("AA_ZERODEV_PROJECTID_OPTIMISM_SEPOLIA");
const BUNDLER_RPC_OPTIMISM_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_OPTIMISM_SEPOLIA}`;
const PAYMASTER_RPC_OPTIMISM_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_OPTIMISM_SEPOLIA}`;

const PROJECT_ID_BASE_SEPOLIA = getEnv("AA_ZERODEV_PROJECTID_BASE_SEPOLIA");
const BUNDLER_RPC_BASE_SEPOLIA = `https://rpc.zerodev.app/api/v2/bundler/${PROJECT_ID_BASE_SEPOLIA}`;
const PAYMASTER_RPC_BASE_SEPOLIA = `https://rpc.zerodev.app/api/v2/paymaster/${PROJECT_ID_BASE_SEPOLIA}`;

const publicClientSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_SEPOLIA),
});

const publicClientPolygon = createPublicClient({
  transport: http(BUNDLER_RPC_POLYGON),
});

const publicClientPolygonMumbai = createPublicClient({
  transport: http(BUNDLER_RPC_POLYGON_MUMBAI),
});

const publicClientArbitrumSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_ARBITRUM_SEPOLIA),
});

const publicClientOptimismSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_OPTIMISM_SEPOLIA),
});

const publicClientBaseSepolia = createPublicClient({
  transport: http(BUNDLER_RPC_BASE_SEPOLIA),
});

export type ChainsSupported =
  | "ethereum_sepolia"
  | "polygon"
  | "polygon_mumbai"
  | "arbitrum_sepolia"
  | "optimism_sepolia"
  | "base_sepolia";
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
  };
  hasWeightedEcdsaValidator: boolean;
  explorer: string;
  blockScoutName: string;
  client: any;
}
type ChainsData = Record<ChainsSupported, ChainData>;

// name = id of currencies
export const chains: ChainsData = {
  ethereum_sepolia: {
    chain: sepolia,
    name: "ethereum_sepolia",
    readableName: "Ethereum Sepolia",
    cryptoCurrencyId: "ethereum", // NOTE: only for demo purpose
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

  polygon_mumbai: {
    chain: polygonMumbai,
    name: "polygon_mumbai",
    cryptoCurrencyId: "polygon",
    readableName: "Polygon",
    id: polygonMumbai.id,
    // rpc: http(polygonMumbai.rpcUrls.default.http[0]),
    rpc: webSocket("wss://polygon-bor-rpc.publicnode.com"),
    zerodev: {
      projectId: PROJECT_ID_POLYGON_MUMBAI,
      bundler: BUNDLER_RPC_POLYGON_MUMBAI,
      paymaster: PAYMASTER_RPC_POLYGON_MUMBAI,
    },
    hasWeightedEcdsaValidator: true,
    explorer: polygonMumbai.blockExplorers.default.url,
    blockScoutName: "",
    client: publicClientPolygonMumbai,
  },
  arbitrum_sepolia: {
    chain: arbitrumSepolia,
    name: "arbitrum_sepolia",
    cryptoCurrencyId: "arbitrum_sepolia",
    readableName: "Arbitrum Sepolia",
    id: arbitrumSepolia.id,
    rpc: http(arbitrumSepolia.rpcUrls.default.http[0]),
    zerodev: {
      projectId: PROJECT_ID_ARBITRUM_SEPOLIA,
      bundler: BUNDLER_RPC_ARBITRUM_SEPOLIA,
      paymaster: PAYMASTER_RPC_ARBITRUM_SEPOLIA,
    },
    hasWeightedEcdsaValidator: true,
    explorer: arbitrumSepolia.blockExplorers.default.url,
    blockScoutName: "", // TODO: find alternative
    client: publicClientArbitrumSepolia,
  },
  optimism_sepolia: {
    chain: optimismSepolia,
    name: "optimism_sepolia",
    cryptoCurrencyId: "optimism", // NOTE: optimism_sepolia not available
    readableName: "Optimism Sepolia",
    id: optimismSepolia.id,
    rpc: http(optimismSepolia.rpcUrls.default.http[0]),
    zerodev: {
      projectId: PROJECT_ID_OPTIMISM_SEPOLIA,
      bundler: BUNDLER_RPC_OPTIMISM_SEPOLIA,
      paymaster: PAYMASTER_RPC_OPTIMISM_SEPOLIA,
    },
    hasWeightedEcdsaValidator: true,
    explorer: optimismSepolia.blockExplorers.default.url,
    blockScoutName: "optimism-sepolia",
    client: publicClientOptimismSepolia,
  },
  base_sepolia: {
    chain: baseSepolia,
    name: "base_sepolia",
    cryptoCurrencyId: "base_sepolia",
    readableName: "Base Sepolia",
    id: baseSepolia.id,
    rpc: http(baseSepolia.rpcUrls.default.http[0]),
    zerodev: {
      projectId: PROJECT_ID_BASE_SEPOLIA,
      bundler: BUNDLER_RPC_BASE_SEPOLIA,
      paymaster: PAYMASTER_RPC_BASE_SEPOLIA,
    },
    hasWeightedEcdsaValidator: true,
    explorer: baseSepolia.blockExplorers.default.url,
    blockScoutName: "base-sepolia",
    client: publicClientBaseSepolia,
  },
};
