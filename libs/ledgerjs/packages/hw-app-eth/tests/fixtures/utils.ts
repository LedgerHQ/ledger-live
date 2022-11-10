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
    approve: ERC20Interface.encodeFunctionData("approve", [
      transactionContracts.random,
      1,
    ]),
    transfer: ERC20Interface.encodeFunctionData("transfer", [
      transactionContracts.random,
      1,
    ]),
  },
  erc721: {
    approve: ERC721Interface.encodeFunctionData("approve", [
      transactionContracts.random,
      1,
    ]),
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
      [transactionContracts.random, transactionContracts.random2, 1]
    ),
    safeTransferFromWithData: ERC721Interface.encodeFunctionData(
      "safeTransferFrom(address, address, uint256, bytes)",
      [transactionContracts.random, transactionContracts.random2, 1, "0x00"]
    ),
  },
  erc1155: {
    setApprovalForAll: ERC1155Interface.encodeFunctionData(
      "setApprovalForAll",
      [transactionContracts.random, true]
    ),
    safeTransferFrom: ERC1155Interface.encodeFunctionData("safeTransferFrom", [
      transactionContracts.random,
      transactionContracts.random2,
      1,
      1,
      "0x00",
    ]),
    safeBatchTransferFrom: ERC1155Interface.encodeFunctionData(
      "safeBatchTransferFrom",
      [
        transactionContracts.random,
        transactionContracts.random2,
        [1],
        [1],
        "0x00",
      ]
    ),
  },
  paraswap: {
    simpleSwap: PARASWAPInterface.encodeFunctionData("simpleSwap", [
      [
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "0x0de0b6b3a7640000",
        "0x3b0b9361b10cf6adef",
        "0x3b57888b592d3085a5",
        [
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "0xE592427A0AEce92De3Edee1F18E0157C05861564",
          "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        ],
        "0xd0e30db0c04b8d59000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee5700000000000000000000000000000000000000000000000000000000636c4a2c0000000000000000000000000000000000000000000000000a8c0ff92d4c00000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000c04b8d59000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee5700000000000000000000000000000000000000000000000000000000636c4a2c0000000000000000000000000000000000000000000000000354a6ba7a18000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000042c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f42260fac5e5542a773aa44fbcfedf7c193bc2c599000bb86b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000",
        ["0x00", "0x04", "0x0128", "0x026c"],
        ["0x0de0b6b3a7640000", "0x00", "0x00"],
        "0x0000000000000000000000000000000000000000",
        "0xe4d12A78a24f63F856B7192BeAAcc9875d387feC",
        "0x0100000000000000000000000000000000000000000000000000000000004000",
        "0x",
        "0x636c907d",
        "0xdfd0d4ab9e9848b08aff9bc3d983eba6",
      ],
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
