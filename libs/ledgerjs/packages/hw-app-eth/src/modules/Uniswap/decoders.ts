import { defaultAbiCoder } from "@ethersproject/abi";
import { WETH_PER_CHAIN_ID } from "./constants";
import { UniswapSupportedCommand } from "./types";

const swapV2Decoder = (input: `0x${string}`): `0x${string}`[] => {
  const [, , , addresses] = defaultAbiCoder.decode(
    ["address", "uint256", "uint256", "address[]", "bool"],
    input,
  );

  return addresses.map(address => address.toLowerCase());
};

const swapV3Decoder = (input: `0x${string}`): `0x${string}`[] => {
  const [, , , path] = defaultAbiCoder.decode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    input,
  );
  // Path is at least 43 bytes long for 2 times 20B addresses + 3B fee in between
  // Example for the pattern pattern: 20B address + 3B fee + 20B address
  // more addresses can be included after another 3B space
  const pathBuffer = Buffer.from(path.slice(2), "hex");

  const tokens: `0x${string}`[] = [];
  let i = 0;
  while (i < pathBuffer.length) {
    tokens.push(
      `0x${pathBuffer
        .subarray(i, i + 20)
        .toString("hex")
        .toLowerCase()}`,
    );
    // Skip 20B address + 3B fee
    i += 23;
  }

  return tokens;
};

const wrapEthDecoder = (input: `0x${string}`, chainId: number | string): `0x${string}`[] => {
  const contract = WETH_PER_CHAIN_ID[chainId];
  return contract instanceof Error ? [] : [contract.toLowerCase()];
};

const sweepDecoder = (input: `0x${string}`): `0x${string}`[] => {
  const [token] = defaultAbiCoder.decode(["address", "address", "uint256"], input);

  return [token.toLowerCase()];
};

const noDecoder = () => [];

export const UniswapDecoders: Record<
  UniswapSupportedCommand,
  (input: `0x${string}`, chainId: number | string) => `0x${string}`[]
> = {
  V2_SWAP_EXACT_IN: swapV2Decoder,
  V2_SWAP_EXACT_OUT: swapV2Decoder,
  V3_SWAP_EXACT_IN: swapV3Decoder,
  V3_SWAP_EXACT_OUT: swapV3Decoder,
  WRAP_ETH: wrapEthDecoder,
  UNWRAP_ETH: wrapEthDecoder,
  PERMIT2_PERMIT: noDecoder,
  PERMIT2_TRANSFER_FROM: noDecoder,
  PERMIT2_PERMIT_BATCH: noDecoder,
  PERMIT2_TRANSFER_FROM_BATCH: noDecoder,
  PAY_PORTION: noDecoder,
  SWEEP: sweepDecoder,
};
