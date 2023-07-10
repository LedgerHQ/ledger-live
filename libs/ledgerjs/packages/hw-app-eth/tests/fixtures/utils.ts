import { ethers } from "ethers";
import ERC20Abi from "./ABI/ERC20.json";
import ERC721Abi from "./ABI/ERC721.json";
import ERC1155Abi from "./ABI/ERC1155.json";
import PARASWAPAbi from "./ABI/PARASWAP.json";

const ERC20Interface = new ethers.utils.Interface(ERC20Abi);
const ERC721Interface = new ethers.utils.Interface(ERC721Abi);
const ERC1155Interface = new ethers.utils.Interface(ERC1155Abi);
const PARASWAPInterface = new ethers.utils.Interface(PARASWAPAbi);

export const transactionContracts = {
  erc20: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
  erc20Swap: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // MATIC
  erc721: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // Bored Ape
  erc1155: "0x348fc118bcc65a92dc033a951af153d14d945312", // Clone X
  paraswap: "0xdef171fe48cf0115b1d80b88dc8eab59176fee57",
  random: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE", // jesus.eth
  random2: "0xc3f95102D5c8F2c83e49Ce3Acfb905eDfb7f37dE", // satan.eth
};

export const transactionData = {
  erc20: {
    approve: ERC20Interface.encodeFunctionData("approve", [transactionContracts.random, 1]),
    transfer: ERC20Interface.encodeFunctionData("transfer", [transactionContracts.random, 1]),
  },
  erc721: {
    approve: ERC721Interface.encodeFunctionData("approve", [transactionContracts.random, 1]),
    setApprovalForAll: ERC721Interface.encodeFunctionData("setApprovalForAll", [
      transactionContracts.random,
      true,
    ]),
    transferFrom: ERC721Interface.encodeFunctionData("transferFrom", [
      transactionContracts.random,
      transactionContracts.random2,
      1,
    ]),
    safeTransferFrom: ERC721Interface.encodeFunctionData(
      "safeTransferFrom(address, address, uint256)",
      [transactionContracts.random, transactionContracts.random2, 1],
    ),
    safeTransferFromWithData: ERC721Interface.encodeFunctionData(
      "safeTransferFrom(address, address, uint256, bytes)",
      [transactionContracts.random, transactionContracts.random2, 1, "0x00"],
    ),
  },
  erc1155: {
    setApprovalForAll: ERC1155Interface.encodeFunctionData("setApprovalForAll", [
      transactionContracts.random,
      true,
    ]),
    safeTransferFrom: ERC1155Interface.encodeFunctionData("safeTransferFrom", [
      transactionContracts.random,
      transactionContracts.random2,
      1,
      1,
      "0x00",
    ]),
    safeBatchTransferFrom: ERC1155Interface.encodeFunctionData("safeBatchTransferFrom", [
      transactionContracts.random,
      transactionContracts.random2,
      [1],
      [1],
      "0x00",
    ]),
  },
  paraswap: {
    simpleSwap: PARASWAPInterface.encodeFunctionData("simpleSwap", [
      [
        "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "0x0de0b6b3a7640000",
        "0x0cd58f8b6f6a3bd1",
        "0x0ce6123215ecb279",
        ["0xE592427A0AEce92De3Edee1F18E0157C05861564"],
        "0xc04b8d59000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee5700000000000000000000000000000000000000000000000000000000636ceabd0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002b7d1afa7b718fb893db30a3abc0cfc608aacfebb0000bb86b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000",
        ["0x00", "0x0124"],
        ["0x00"],
        "0x0000000000000000000000000000000000000000",
        "0x558247e365be655f9144e1a0140D793984372Ef3",
        "0x010000000000000000000000000000000000000000000000000000000000405f",
        "0x",
        "0x636d310d",
        "0xda03875dad634e49b94b93aff3d28c4a",
      ],
    ]),
    swapOnUniswapV2Fork: PARASWAPInterface.encodeFunctionData("swapOnUniswapV2Fork", [
      "7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      "0x0de0b6b3a7640000",
      "0x12ba8fbb209c3a65",
      "0000000000000000000000000000000000000000",
      ["0x4de55ce50407b614daff085522d476c5ec5e93a00afb"],
    ]),
  },
};

export const getTransactionHash = (to: string, data: string): string =>
  ethers.utils
    .serializeTransaction({
      to,
      nonce: 0,
      gasLimit: 21000,
      data,
      value: 1,
      chainId: 1,
      maxPriorityFeePerGas: 10000,
      maxFeePerGas: 1000000,
      type: 2,
    })
    .substring(2);
