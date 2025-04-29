import BigNumber from "bignumber.js";
import { SetupServerApi, setupServer } from "msw/node";
import BlueBirdPromise from "bluebird";
import { http, HttpResponse, bypass } from "msw";
import { utils, providers, ethers } from "ethers";
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from "@ledgerhq/coin-evm/abis/index";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/logic";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
  LedgerExplorerOperation,
} from "@ledgerhq/coin-evm/types/index";

type TraceTransaction = {
  action: {
    from: `0x${string}`;
    to?: `0x${string}`;
    gas: `0x${string}`;
    init: `0x${string}`;
    value: `0x${string}`;
    input?: `0x${string}`;
    callType?: string;
  };
  blockHash: `0x${string}`;
  blockNumber: number;
  result: {
    address: `0x${string}`;
    code: `0x${string}`;
    gasUsed: `0x${string}`;
  };
  subtraces: number;
  traceAddress: unknown[];
  transactionHash: `0x${string}`;
  transactionPosition: number;
  type: string;
};

const MAX_BLOCK_RANGE = 1024;

const ERC20Interface = new utils.Interface(ERC20_ABI);
const ERC721Interface = new utils.Interface(ERC721_ABI);
const ERC1155Interface = new utils.Interface(ERC1155_ABI);

const TRANSFER_EVENTS_TOPICS = {
  ERC20: ERC20Interface.getEventTopic("Transfer"),
  ERC721: ERC721Interface.getEventTopic("Transfer"),
  ERC1155: ERC1155Interface.getEventTopic("TransferSingle"),
};

const explorerEtherscanOperationByAddress: Record<string, Map<string, EtherscanOperation> | null> =
  {};
const explorerEtherscanERC20EventsByAddress: Record<
  string,
  Map<string, EtherscanERC20Event> | null
> = {};
const explorerEtherscanERC721EventsByAddress: Record<
  string,
  Map<string, EtherscanERC721Event> | null
> = {};
const explorerEtherscanERC1155EventsByAddress: Record<
  string,
  Map<string, EtherscanERC1155Event> | null
> = {};
const explorerEtherscanInternalByAddress: Record<
  string,
  Map<string, EtherscanInternalTransaction> | null
> = {};
const explorerLedgerOperationByAddress: Record<
  string,
  Map<string, LedgerExplorerOperation> | null
> = {};

export const resetIndexer = () => {
  setBlock(0);
  server?.close();

  for (const address in explorerEtherscanOperationByAddress) {
    delete explorerEtherscanOperationByAddress[address];
  }
  for (const address in explorerEtherscanERC20EventsByAddress) {
    delete explorerEtherscanERC20EventsByAddress[address];
  }
  for (const address in explorerEtherscanERC721EventsByAddress) {
    delete explorerEtherscanERC721EventsByAddress[address];
  }
  for (const address in explorerEtherscanERC1155EventsByAddress) {
    delete explorerEtherscanERC1155EventsByAddress[address];
  }
  for (const address in explorerEtherscanInternalByAddress) {
    delete explorerEtherscanInternalByAddress[address];
  }
  for (const address in explorerLedgerOperationByAddress) {
    delete explorerLedgerOperationByAddress[address];
  }
};

const handleLog = async (log: providers.Log, provider: ethers.providers.StaticJsonRpcProvider) => {
  const contractDecimals = await provider
    .call({ to: log.address, data: ERC20Interface.encodeFunctionData("decimals") })
    .then(res => (!res || res === "0x" ? false : true));

  const isERC20 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC20 && contractDecimals;
  const isERC721 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC721 && !contractDecimals;
  const isERC1155 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC1155;

  if (isERC20) {
    return handleERC20Log(log, provider);
  } else if (isERC721) {
    return handleERC721Log(log, provider);
  } else if (isERC1155) {
    return handleERC1155Log(log, provider);
  }
};

const handleERC20Log = async (
  log: providers.Log,
  provider: ethers.providers.StaticJsonRpcProvider,
) => {
  const [name, ticker, decimals, block, tx, receipt] = await Promise.all([
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("name") })
      .then(res => ethers.utils.defaultAbiCoder.decode(["string"], res)[0]),
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("symbol") })
      .then(res => ethers.utils.defaultAbiCoder.decode(["string"], res)[0]),
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("decimals") })
      .then(res => new BigNumber(res).toString()),
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0]);
  const to = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0]);
  const amount = ethers.BigNumber.from(log.data === "0x" ? 0 : log.data).toString();

  const etherscanErc20Event: EtherscanERC20Event = {
    blockNumber: block.number.toString(),
    timeStamp: block.timestamp.toString(),
    hash: log.transactionHash,
    nonce: tx.nonce.toString(),
    blockHash: block.hash,
    from,
    to,
    value: amount,
    tokenName: name,
    tokenSymbol: ticker,
    tokenDecimal: decimals,
    transactionIndex: block.transactions.indexOf(log.transactionHash).toString(),
    gas: tx.gasLimit.toString(),
    gasPrice: tx.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx.data,
    confirmations: tx.confirmations.toString(),
    contractAddress: tx.to!.toLowerCase(),
  };

  if (!explorerEtherscanERC20EventsByAddress[from]) {
    explorerEtherscanERC20EventsByAddress[from] = new Map<string, EtherscanERC20Event>();
  }
  if (!explorerEtherscanERC20EventsByAddress[to]) {
    explorerEtherscanERC20EventsByAddress[to] = new Map<string, EtherscanERC20Event>();
  }
  explorerEtherscanERC20EventsByAddress[from]!.set(etherscanErc20Event.hash, etherscanErc20Event);
  explorerEtherscanERC20EventsByAddress[to]!.set(etherscanErc20Event.hash, etherscanErc20Event);

  if (!explorerLedgerOperationByAddress[from]) {
    explorerLedgerOperationByAddress[from] = new Map<string, LedgerExplorerOperation>();
  }
  if (!explorerLedgerOperationByAddress[to]) {
    explorerLedgerOperationByAddress[to] = new Map<string, LedgerExplorerOperation>();
  }
  const alreadyExistingOperation =
    explorerLedgerOperationByAddress[from]!.get(tx.hash) ||
    explorerLedgerOperationByAddress[to]!.get(tx.hash);
  const ledgerOperation: LedgerExplorerOperation = alreadyExistingOperation
    ? {
        ...alreadyExistingOperation,
        transfer_events: [
          {
            contract: log.address,
            count: amount,
            from,
            to,
          },
        ],
      }
    : {
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
        transfer_events: [
          {
            contract: log.address,
            count: amount,
            from,
            to,
          },
        ],
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
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date(block.timestamp * 1000).toISOString(),
        },
      };
  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleERC721Log = async (
  log: providers.Log,
  provider: ethers.providers.StaticJsonRpcProvider,
) => {
  const [block, tx, receipt] = await Promise.all([
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0]);
  const to = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0]);
  const tokenID = ethers.utils.defaultAbiCoder.decode(["uint256"], log.topics[3])[0].toString();

  const erc721Event: EtherscanERC721Event = {
    blockNumber: block.number.toString(),
    timeStamp: block.timestamp.toString(),
    hash: tx.hash,
    nonce: tx.nonce.toString(),
    blockHash: block.hash,
    from,
    to,
    transactionIndex: block.transactions.indexOf(log.transactionHash).toString(),
    gas: tx.gasLimit.toString(),
    gasPrice: tx.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx.data,
    confirmations: tx.confirmations.toString(),
    contractAddress: tx.to!,
    tokenID,
    tokenName: "tokenName",
    tokenSymbol: "tokenSymbol",
    tokenDecimal: "0",
  };

  if (!explorerEtherscanERC721EventsByAddress[from]) {
    explorerEtherscanERC721EventsByAddress[from] = new Map<string, EtherscanERC721Event>();
  }
  if (!explorerEtherscanERC721EventsByAddress[to]) {
    explorerEtherscanERC721EventsByAddress[to] = new Map<string, EtherscanERC721Event>();
  }
  explorerEtherscanERC721EventsByAddress[from]!.set(erc721Event.hash, erc721Event);
  explorerEtherscanERC721EventsByAddress[to]!.set(erc721Event.hash, erc721Event);

  if (!explorerLedgerOperationByAddress[from]) {
    explorerLedgerOperationByAddress[from] = new Map<string, LedgerExplorerOperation>();
  }
  if (!explorerLedgerOperationByAddress[to]) {
    explorerLedgerOperationByAddress[to] = new Map<string, LedgerExplorerOperation>();
  }
  const alreadyExistingOperation =
    explorerLedgerOperationByAddress[from]!.get(tx.hash) ||
    explorerLedgerOperationByAddress[to]!.get(tx.hash);
  const ledgerOperation: LedgerExplorerOperation = alreadyExistingOperation
    ? {
        ...alreadyExistingOperation,
        erc721_transfer_events: [
          {
            contract: log.address,
            sender: from,
            receiver: to,
            token_id: tokenID,
          },
        ],
      }
    : {
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
        transfer_events: [],
        erc721_transfer_events: [
          {
            contract: log.address,
            sender: from,
            receiver: to,
            token_id: tokenID,
          },
        ],
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
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date(block.timestamp * 1000).toISOString(),
        },
      };

  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleERC1155Log = async (
  log: providers.Log,
  provider: ethers.providers.StaticJsonRpcProvider,
) => {
  const [block, tx, receipt] = await Promise.all([
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[2])[0]);
  const to = safeEncodeEIP55(ethers.utils.defaultAbiCoder.decode(["address"], log.topics[3])[0]);
  const operator = safeEncodeEIP55(
    ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0],
  );

  const transfersMap: [string, string][] = ethers.utils.defaultAbiCoder
    .decode(["uint256", "uint256"], log.data)
    .map((value, index) => [index === 0 ? "id" : "value", value.toString()]);

  const etherscanERC1155Events: EtherscanERC1155Event[] = transfersMap.map(([id, value]) => ({
    blockNumber: block.number.toString(),
    timeStamp: block.timestamp.toString(),
    hash: tx.hash,
    nonce: tx.nonce.toString(),
    blockHash: block.hash,
    from,
    to,
    transactionIndex: block.transactions.indexOf(log.transactionHash).toString(),
    gas: tx.gasLimit.toString(),
    gasPrice: tx.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx.data,
    confirmations: tx.confirmations.toString(),
    contractAddress: tx.to!,
    tokenID: id,
    tokenValue: value,
    tokenName: "tokenName",
    tokenSymbol: "tokenSymbol",
  }));

  etherscanERC1155Events.forEach(erc1155Event => {
    if (!explorerEtherscanERC1155EventsByAddress[from]) {
      explorerEtherscanERC1155EventsByAddress[from] = new Map<string, EtherscanERC1155Event>();
    }
    if (!explorerEtherscanERC1155EventsByAddress[to]) {
      explorerEtherscanERC1155EventsByAddress[to] = new Map<string, EtherscanERC1155Event>();
    }

    explorerEtherscanERC1155EventsByAddress[from]!.set(erc1155Event.hash, erc1155Event);
    explorerEtherscanERC1155EventsByAddress[to]!.set(erc1155Event.hash, erc1155Event);
  });

  if (!explorerLedgerOperationByAddress[from]) {
    explorerLedgerOperationByAddress[from] = new Map<string, LedgerExplorerOperation>();
  }
  if (!explorerLedgerOperationByAddress[to]) {
    explorerLedgerOperationByAddress[to] = new Map<string, LedgerExplorerOperation>();
  }
  const alreadyExistingOperation =
    explorerLedgerOperationByAddress[from]!.get(tx.hash) ||
    explorerLedgerOperationByAddress[to]!.get(tx.hash);
  const ledgerOperation: LedgerExplorerOperation = alreadyExistingOperation
    ? {
        ...alreadyExistingOperation,
        erc1155_transfer_events: [
          {
            contract: log.address,
            sender: from,
            receiver: to,
            operator,
            transfers: [Object.fromEntries(transfersMap) as { id: string; value: string }],
          },
        ],
      }
    : {
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
        transfer_events: [],
        erc721_transfer_events: [],
        erc1155_transfer_events: [
          {
            contract: log.address,
            sender: from,
            receiver: to,
            operator,
            transfers: [Object.fromEntries(transfersMap) as { id: string; value: string }],
          },
        ],
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

  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleBlock = async (
  blockNumber: number,
  provider: ethers.providers.StaticJsonRpcProvider,
) => {
  const block = await provider.getBlockWithTransactions(blockNumber);

  for (const transaction of block?.transactions || []) {
    const [tx, receipt, traces] = await Promise.all([
      provider.getTransaction(transaction.hash),
      provider.getTransactionReceipt(transaction.hash),
      provider.send("trace_transaction", [transaction.hash]).catch(() => []) as Promise<
        TraceTransaction[]
      >,
    ]);

    const code = transaction.to ? await provider.getCode(transaction.to) : false;
    const from = safeEncodeEIP55(transaction.from);
    const to = safeEncodeEIP55(transaction.to || "");
    const etherscanOperation: EtherscanOperation = {
      blockNumber: block.number.toString(),
      timeStamp: block.timestamp.toString(),
      hash: transaction.hash,
      nonce: transaction.nonce.toString(),
      blockHash: block.hash,
      transactionIndex: block.transactions.indexOf(transaction).toString(),
      from,
      to,
      value: transaction.value.toBigInt().toString(),
      gas: transaction.gasLimit.toString(),
      gasPrice: transaction.gasPrice?.toString() || "",
      isError: receipt.status === 1 ? "0" : "1",
      txreceipt_status: receipt.status!.toString(),
      input: transaction.data,
      contractAddress: code === "0x" ? "" : transaction.to!,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt?.gasUsed?.toString() || "0",
      confirmations: transaction.confirmations.toString(),
      methodId: transaction.data?.length > 10 ? transaction.data.slice(0, 10) : "",
      functionName: "",
    };

    if (!explorerEtherscanOperationByAddress[from]) {
      explorerEtherscanOperationByAddress[from] = new Map<string, EtherscanOperation>();
    }
    if (!explorerEtherscanOperationByAddress[to]) {
      explorerEtherscanOperationByAddress[to] = new Map<string, EtherscanOperation>();
    }
    explorerEtherscanOperationByAddress[from]!.set(etherscanOperation.hash, etherscanOperation);
    explorerEtherscanOperationByAddress[to]!.set(etherscanOperation.hash, etherscanOperation);

    if (!explorerLedgerOperationByAddress[from]) {
      explorerLedgerOperationByAddress[from] = new Map<string, LedgerExplorerOperation>();
    }
    if (!explorerLedgerOperationByAddress[to]) {
      explorerLedgerOperationByAddress[to] = new Map<string, LedgerExplorerOperation>();
    }
    const ledgerOperation: LedgerExplorerOperation = {
      hash: receipt.transactionHash,
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
        hash: receipt.blockHash,
        height: receipt.blockNumber,
        time: new Date(block.timestamp * 1000).toISOString(),
      },
    };
    explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
    explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);

    for (const { action, result, type, transactionHash, transactionPosition } of traces.filter(
      trace => trace.type === "call",
    )) {
      if (action?.callType !== "call") continue;
      const code = action.to ? await provider.getCode(action.to) : false;
      const from = safeEncodeEIP55(action.from || "");
      const to = safeEncodeEIP55(action.to || "");
      const etherscanInternalTransaction: EtherscanInternalTransaction = {
        blockNumber: blockNumber.toString(),
        timeStamp: block.timestamp.toString(),
        hash: transactionHash,
        from,
        to,
        value: ethers.BigNumber.from(action.value).toBigInt().toString(),
        contractAddress: code === "0x" ? "" : action.to!,
        input: action.input || "0x",
        type,
        gas: ethers.BigNumber.from(action.gas).toBigInt().toString(),
        gasUsed: ethers.BigNumber.from(result?.gasUsed || "0")
          .toBigInt()
          .toString(),
        traceId: transactionPosition.toString(),
        isError: receipt.status === 1 ? "0" : "1",
        errCode: "",
      };

      if (!explorerEtherscanInternalByAddress[from]) {
        explorerEtherscanInternalByAddress[from] = new Map<string, EtherscanInternalTransaction>();
      }
      if (!explorerEtherscanInternalByAddress[to]) {
        explorerEtherscanInternalByAddress[to] = new Map();
      }
      explorerEtherscanInternalByAddress[from]!.set(
        etherscanInternalTransaction.hash,
        etherscanInternalTransaction,
      );
      explorerEtherscanInternalByAddress[to]!.set(
        etherscanInternalTransaction.hash,
        etherscanInternalTransaction,
      );

      if (!explorerLedgerOperationByAddress[from]) {
        explorerLedgerOperationByAddress[from] = new Map();
      }
      if (!explorerLedgerOperationByAddress[to]) {
        explorerLedgerOperationByAddress[to] = new Map();
      }
      const alreadyExistingOperation =
        explorerLedgerOperationByAddress[from]!.get(tx.hash) ||
        explorerLedgerOperationByAddress[to]!.get(tx.hash);
      const ledgerOperation: LedgerExplorerOperation = alreadyExistingOperation
        ? {
            ...alreadyExistingOperation,
            actions: [
              ...alreadyExistingOperation.actions,
              {
                from,
                to,
                input: null,
                value: ethers.BigNumber.from(action.value).toBigInt().toString(),
                gas: ethers.BigNumber.from(action.gas).toBigInt().toString(),
                gas_used: ethers.BigNumber.from(result?.gasUsed || "0")
                  .toBigInt()
                  .toString(),
                error: null,
              },
            ],
          }
        : {
            hash: receipt.transactionHash,
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
            actions: [
              {
                from,
                to,
                input: null,
                value: ethers.BigNumber.from(action.value).toBigInt().toString(),
                gas: ethers.BigNumber.from(action.gas).toBigInt().toString(),
                gas_used: ethers.BigNumber.from(result?.gasUsed || "0")
                  .toBigInt()
                  .toString(),
                error: null,
              },
            ],
            confirmations: tx.confirmations,
            input: null,
            gas_used: receipt.gasUsed.toString(),
            cumulative_gas_used: receipt.cumulativeGasUsed.toString(),
            status: receipt.status!,
            received_at: new Date(block.timestamp * 1000).toISOString(),
            block: {
              hash: receipt.blockHash,
              height: receipt.blockNumber,
              time: new Date(block.timestamp * 1000).toISOString(),
            },
          };
      explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
    }
  }
};

let fromBlock: number;
export const setBlock = (blockHeight: number): void => {
  fromBlock = blockHeight;
};

export const indexBlocks = async () => {
  if (!fromBlock) {
    throw new Error("fromBlock is not set");
  }

  const provider = new providers.StaticJsonRpcProvider(process.env.RPC);
  let latestBlockNumber = await provider.getBlockNumber();
  const toBlock = Math.min(fromBlock + MAX_BLOCK_RANGE, latestBlockNumber);
  const rangeSize = toBlock - fromBlock + 1;
  const blocks =
    rangeSize > 1
      ? Array(rangeSize)
          .fill("")
          .map((_, index) => fromBlock + index)
          .sort((a, b) => a - b)
      : [latestBlockNumber];

  const logs = await provider.getLogs({
    fromBlock,
    toBlock,
    topics: [
      [TRANSFER_EVENTS_TOPICS.ERC20, TRANSFER_EVENTS_TOPICS.ERC721, TRANSFER_EVENTS_TOPICS.ERC1155],
    ],
  });

  await BlueBirdPromise.map(
    blocks,
    async blockNumber =>
      Promise.all([
        handleBlock(blockNumber, provider),
        new Promise(resolve => setTimeout(resolve, 500)),
      ]),
    { concurrency: 10 },
  );
  await BlueBirdPromise.map(
    logs,
    async log =>
      Promise.all([handleLog(log, provider), new Promise(resolve => setTimeout(resolve, 500))]),
    { concurrency: 10 },
  );

  latestBlockNumber = await provider.getBlockNumber();
  setBlock(Math.min(toBlock, latestBlockNumber));

  console.log(`Indexing completed ✓`);
};

let server: SetupServerApi;
export const initMswHandlers = (currencyConfig: EvmConfigInfo) => {
  const handlers = [];

  if (currencyConfig.explorer.type === "ledger") {
    handlers.push(
      http.get("*.ledger.com/blockchain/v4/*/address/*/txs", async ({ request, params }) => {
        const address = params["2"] as string;
        const response = await fetch(bypass(request)).then(res => res.json());
        const opsMap = explorerLedgerOperationByAddress[address || ""] || new Map();
        response.data.push(...opsMap.values());

        return HttpResponse.json(response);
      }),
    );
  } else if (currencyConfig.explorer.type !== "none") {
    handlers.push(
      http.get(currencyConfig.explorer.uri, async ({ request }) => {
        const uri = new URL(request.url).searchParams;
        const address = uri.get("address");
        const action = uri.get("action");
        const response = await fetch(bypass(request)).then(res => res.json());

        switch (action) {
          case "txlist": {
            const opsMap = explorerEtherscanOperationByAddress[address || ""] || new Map();
            response.result.push(...opsMap.values());
            break;
          }
          case "tokentx": {
            const erc20EventsMap =
              explorerEtherscanERC20EventsByAddress[address || ""] || new Map();
            response.result.push(...erc20EventsMap.values());
            break;
          }
          case "tokennfttx": {
            const erc721EventsMap =
              explorerEtherscanERC721EventsByAddress[address || ""] || new Map();
            response.result.push(...erc721EventsMap.values());
            break;
          }
          case "token1155tx": {
            const erc1155EventsMap =
              explorerEtherscanERC1155EventsByAddress[address || ""] || new Map();
            response.result.push(...erc1155EventsMap.values());
            break;
          }
          case "txlistinternal": {
            const internalMap = explorerEtherscanInternalByAddress[address || ""] || new Map();
            response.result.push(...internalMap.values());
            break;
          }
        }

        return HttpResponse.json(response);
      }),
    );
  }

  server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: "bypass" });
};
