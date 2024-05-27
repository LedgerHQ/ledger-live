import type { Transaction } from "ethers";
import { Interface } from "@ethersproject/abi";
import { byContractAddressAndChainId, findERC20SignaturesInfo } from "../../services/ledger/erc20";

const WETH9PerChainId = {
  // Ethereum Mainnet
  1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  // Ethereum Goerli
  5: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  // Ethereum Sepolia
  11155111: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  // Arbitrum One
  42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  // Arbitrum Goerli
  421613: "0xe39Ab88f8A4777030A534146A9Ca3B52bd5D43A3",
  // Avalanche C-Chain
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  // BSC
  56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  // Base
  8453: "0x4200000000000000000000000000000000000006",
  // Base Goerli
  84531: "0x44D627f900da8AdaC7561bD73aA745F132450798",
  // Blast
  23888: "0x4300000000000000000000000000000000000004",
  // Celo
  42220: new Error("Celo isn't supporting wrapping Eth"),
  // Celo Alfajores
  44787: new Error("Celo Alfajores isn't supporting wrapping Eth"),
  // Optimism
  10: "0x4200000000000000000000000000000000000006",
  // Optimism Goerli
  420: "0x4200000000000000000000000000000000000006",
  // Polygon
  137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  // Polygon Mumbai
  80001: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
};

type UniswapSupportedCommand =
  | "V2_SWAP_EXACT_IN"
  | "V2_SWAP_EXACT_OUT"
  | "V3_SWAP_EXACT_IN"
  | "V3_SWAP_EXACT_OUT"
  | "WRAP_ETH"
  | "UNWRAP_ETH";

const UNISWAP_UNIVERSAL_ROUTER_ADDRESS = "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad";
const UNISWAP_EXECUTE_SELECTOR = "0x3593564c";

const UniswapCommands: Record<`0x${string}`, UniswapSupportedCommand> = {
  "0x08": "V2_SWAP_EXACT_IN",
  "0x09": "V2_SWAP_EXACT_OUT",
  "0x00": "V3_SWAP_EXACT_IN",
  "0x01": "V3_SWAP_EXACT_OUT",
  "0x0b": "WRAP_ETH",
  "0x0c": "UNWRAP_ETH",
};

const defaultSwapDecoder = (input: `0x${string}`): `0x${string}`[] => {
  // Take the last 43 bytes of the "path"
  // Constructed like this: 20B + 3B + 20B
  //
  const pathBuffer = Buffer.from(input.slice(2), "hex").slice(-43);

  return [
    `0x${pathBuffer.subarray(0, 20).toString("hex")}`,
    `0x${pathBuffer.subarray(23, 43).toString("hex")}`,
  ];
};

const wrapEthDecoder = (input: `0x${string}`, chainId: number | string): `0x${string}`[] => {
  const contract = WETH9PerChainId[chainId];
  return contract instanceof Error ? [] : [contract];
};

const UniswapDecoders: Record<
  UniswapSupportedCommand,
  (input: `0x${string}`, chainId: number | string) => `0x${string}`[]
> = {
  V2_SWAP_EXACT_IN: defaultSwapDecoder,
  V2_SWAP_EXACT_OUT: defaultSwapDecoder,
  V3_SWAP_EXACT_IN: defaultSwapDecoder,
  V3_SWAP_EXACT_OUT: defaultSwapDecoder,
  WRAP_ETH: wrapEthDecoder,
  UNWRAP_ETH: wrapEthDecoder,
};

const getTokensFromUniswapCalldata = (
  calldata: `0x${string}`,
  chainId: number | string,
): `0x${string}`[] => {
  const [commands, inputs] = new Interface([
    "function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable",
  ]).decodeFunctionData("execute", calldata) as [`0x${string}`, `0x${string}`[]];
  const commandsBuffer = Buffer.from(commands.slice(2), "hex");

  const tokenAddresses = new Set<`0x${string}`>();
  for (let i = 0; i < commandsBuffer.length; i++) {
    const command = commandsBuffer.subarray(i, i + 1).toString("hex");
    const commandName = UniswapCommands[`0x${command}`];

    const commandDecoder = UniswapDecoders[commandName];

    if (commandDecoder) {
      commandDecoder(inputs[i], chainId).forEach(tokenAddress => tokenAddresses.add(tokenAddress));
    }
  }

  return Array.from(tokenAddresses);
};

export const loadInfosForUniswap = async (
  transaction: Transaction,
  chainIdTruncated: number,
): Promise<{ pluginData?: Buffer; tokenDescriptors?: Buffer[] }> => {
  const calldataSelector = transaction.data.slice(0, 10);
  if (
    calldataSelector.toLowerCase() !== UNISWAP_EXECUTE_SELECTOR ||
    transaction.to?.toLowerCase() !== UNISWAP_UNIVERSAL_ROUTER_ADDRESS
  ) {
    return {};
  }

  const tokens = getTokensFromUniswapCalldata(transaction.data as `0x${string}`, chainIdTruncated);
  const tokenDescriptors = (await Promise.all(
    tokens.map(async token => {
      const erc20SignaturesBlob = await findERC20SignaturesInfo({}, chainIdTruncated);
      return byContractAddressAndChainId(token, chainIdTruncated, erc20SignaturesBlob)?.data;
    }),
  ).then(descriptors => descriptors.filter(Boolean))) as Buffer[];

  if (tokenDescriptors.length) {
    const pluginName = "Uniswap";
    const lengthBuff = Buffer.alloc(1);
    lengthBuff.writeUIntBE(pluginName.length, 0, 1);
    const pluginNameBuff = Buffer.from(pluginName);
    const contractAddressBuff = Buffer.from(UNISWAP_UNIVERSAL_ROUTER_ADDRESS.slice(2), "hex");
    const selectorBuff = Buffer.from(UNISWAP_EXECUTE_SELECTOR.slice(2), "hex");

    const pluginData = Buffer.concat([
      lengthBuff,
      pluginNameBuff,
      contractAddressBuff,
      selectorBuff,
    ]);

    console.log({ pluginData: pluginData.toString("hex") });

    return {
      pluginData,
      tokenDescriptors,
    };
  }

  return {};
};
