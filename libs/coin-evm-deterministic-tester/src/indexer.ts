import { setupServer } from "msw/node";
import { http, HttpResponse, bypass } from "msw";
import { utils, providers, ethers } from "ethers";
import { LedgerExplorerOperation } from "@ledgerhq/coin-evm/lib/types/index";
import ERC1155ABI from "./abis/erc1155.json";
import ERC721ABI from "./abis/erc721.json";
import ERC20ABI from "./abis/erc20.json";
import { provider } from "./helpers";

const ERC20Interface = new utils.Interface(ERC20ABI);
const ERC721Interface = new utils.Interface(ERC721ABI);
const ERC1155Interface = new utils.Interface(ERC1155ABI);

const TRANSFER_EVENTS_TOPICS = {
  ERC20: ERC20Interface.getEventTopic("Transfer"),
  ERC721: ERC721Interface.getEventTopic("Transfer"),
  ERC1155: ERC1155Interface.getEventTopic("TransferSingle"),
};

let fromBlock: number;
export const setBlock = async () => {
  fromBlock = await provider.getBlockNumber();
};

const explorerAppendixByAddress: Record<string, Map<string, LedgerExplorerOperation>> = {};
export const clearExplorerAppendix = () => {
  for (const address in explorerAppendixByAddress) {
    delete explorerAppendixByAddress[address];
  }
};

export const getLogs = async (): Promise<providers.Log[]> => {
  if (!fromBlock) {
    await setBlock();
  }

  const toBlock = await provider.getBlockNumber();
  // console.log({ toBlock });
  const logs = await provider.getLogs({
    fromBlock,
    toBlock,
    topics: [TRANSFER_EVENTS_TOPICS.ERC20],
  });

  // console.log(logs.length, "LOGS FOUND");
  if (logs.length) {
    for (const log of logs) {
      const [receipt, tx, block, contractDecimals] = await Promise.all([
        provider.getTransactionReceipt(log.transactionHash),
        provider.getTransaction(log.transactionHash),
        provider.getBlock(log.blockHash),
        provider
          .call({ to: log.address, data: ERC20Interface.encodeFunctionData("decimals") })
          .then(res => (!res || res === "0x" ? false : true)),
      ]);

      const isERC20 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC20 && contractDecimals;
      const isERC721 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC721 && !contractDecimals;
      const isERC1155 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC1155;

      const operation: LedgerExplorerOperation = {
        hash: log.transactionHash,
        transaction_type: receipt.type,
        nonce: "",
        nonce_value: -1,
        value: tx.value.toString(),
        gas: tx.gasLimit.toString(),
        gas_price: receipt.effectiveGasPrice.toString(),
        max_fee_per_gas: tx.type === 2 ? tx.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx.type === 2 ? tx.maxPriorityFeePerGas!.toString() : null,
        from: tx.from,
        to: tx.to!,
        transfer_events: isERC20
          ? [
              {
                contract: log.address,
                count: ethers.BigNumber.from(log.data).toString(),
                from: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0],
                to: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0],
              },
            ]
          : [],
        erc721_transfer_events: isERC721
          ? [
              {
                contract: log.address,
                token_id: ethers.BigNumber.from(log.data).toString(),
                sender: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0],
                receiver: ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0],
              },
            ]
          : [],
        erc1155_transfer_events: isERC1155
          ? [
              // TODO
            ]
          : [],
        approval_events: [],
        actions: [],
        confirmations: tx.confirmations,
        input: null,
        gas_used: receipt.gasUsed.toString(),
        cumulative_gas_used: receipt.cumulativeGasUsed.toString(),
        status: receipt.status!,
        received_at: new Date(block.timestamp * 1000).toISOString(),
        block: {
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date(block.timestamp * 1000).toISOString(),
        },
      };

      const from = ethers.utils.defaultAbiCoder.decode(
        ["address"],
        isERC20 || isERC721 ? log.topics[1] : log.topics[2],
      )[0];
      const to = ethers.utils.defaultAbiCoder.decode(
        ["address"],
        isERC20 || isERC721 ? log.topics[2] : log.topics[3],
      )[0];

      if (!explorerAppendixByAddress[from]) {
        explorerAppendixByAddress[from] = new Map();
      }
      explorerAppendixByAddress[from].set(operation.hash, operation);

      if (!explorerAppendixByAddress[to]) {
        explorerAppendixByAddress[to] = new Map();
      }
      explorerAppendixByAddress[to].set(operation.hash, operation);

      // fromBlock = log.blockNumber;
    }
  }

  // console.log(explorerAppendixByAddress);

  return logs;
};

export const indexBlocks = async () => {
  const toBlock = await provider.getBlockNumber();

  for (let blockNumber = fromBlock; blockNumber < toBlock; blockNumber++) {
    const block = await provider.getBlock(blockNumber);

    for (const transactionHash in block.transactions) {
      const [receipt, tx] = await Promise.all([
        provider.getTransactionReceipt(transactionHash),
        provider.getTransaction(transactionHash),
      ]);

      const operation: LedgerExplorerOperation = {
        hash: transactionHash,
        transaction_type: receipt.type,
        nonce: "",
        nonce_value: -1,
        value: tx.value.toString(),
        gas: tx.gasLimit.toString(),
        gas_price: receipt.effectiveGasPrice.toString(),
        max_fee_per_gas: tx.type === 2 ? tx.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx.type === 2 ? tx.maxPriorityFeePerGas!.toString() : null,
        from: tx.from,
        to: tx.to!,
        transfer_events: [],
        erc721_transfer_events: [],
        erc1155_transfer_events: [],
        approval_events: [],
        actions: [],
        confirmations: tx.confirmations,
        input: null,
        gas_used: receipt.gasUsed.toString(),
        cumulative_gas_used: receipt.cumulativeGasUsed.toString(),
        status: receipt.status!,
        received_at: new Date(block.timestamp * 1000).toISOString(),
        block: {
          hash: block.hash,
          height: block.number,
          time: new Date(block.timestamp * 1000).toISOString(),
        },
      };

      if (!explorerAppendixByAddress[tx.from]) {
        explorerAppendixByAddress[tx.from] = new Map();
      }
      explorerAppendixByAddress[tx.from].set(operation.hash, operation);

      if (tx.to) {
        if (!explorerAppendixByAddress[tx.to]) {
          explorerAppendixByAddress[tx.to] = new Map();
        }
        explorerAppendixByAddress[tx.to].set(operation.hash, operation);
      }
    }
  }
};

const handlers = [
  http.get("*/blockchain/v4/*/address/*/txs", async ({ request, params }) => {
    const address = params["2"] as string;
    const response = await fetch(bypass(request)).then(res => res.json());
    const opsMap = explorerAppendixByAddress[address || ""] || new Map();
    response.data.push(...opsMap.values());

    return HttpResponse.json(response);
  }),
];

const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "bypass" });
