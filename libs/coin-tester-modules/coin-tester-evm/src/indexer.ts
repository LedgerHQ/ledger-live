import BigNumber from "bignumber.js";
import { SetupServerApi, setupServer } from "msw/node";
import { http, HttpResponse, bypass } from "msw";
import { AbiCoder, ethers } from "ethers";
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from "@ledgerhq/coin-evm/abis/index";
import { safeEncodeEIP55 } from "@ledgerhq/coin-evm/utils";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type {
  EtherscanERC1155Event,
  EtherscanERC20Event,
  EtherscanERC721Event,
  EtherscanInternalTransaction,
  EtherscanOperation,
  LedgerExplorerOperation,
} from "@ledgerhq/coin-evm/types/index";
import { promiseAllBatched } from "@ledgerhq/live-common/promise";

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

const ERC20Interface = new ethers.Interface(ERC20_ABI);
const ERC721Interface = new ethers.Interface(ERC721_ABI);
const ERC1155Interface = new ethers.Interface(ERC1155_ABI);

const TRANSFER_EVENTS_TOPICS = {
  ERC20: ERC20Interface.getEvent("Transfer")?.topicHash || "",
  ERC721: ERC721Interface.getEvent("Transfer")?.topicHash || "",
  ERC1155: ERC1155Interface.getEvent("TransferSingle")?.topicHash || "",
};

const abiCoder = new AbiCoder();

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

const handleLog = async (log: ethers.Log, provider: ethers.JsonRpcProvider) => {
  let hasDecimals = false;

  try {
    const res = await provider.call({
      to: log.address,
      data: ERC20Interface.encodeFunctionData("decimals"),
    });
    // if call didn’t revert and returned something valid
    hasDecimals = !!(res && res !== "0x");
  } catch {
    // execution reverted → no decimals()
    hasDecimals = false;
  }

  const isERC20 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC20 && hasDecimals;
  const isERC721 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC721 && !hasDecimals;
  const isERC1155 = log.topics[0] === TRANSFER_EVENTS_TOPICS.ERC1155;

  if (isERC20) {
    return handleERC20Log(log, provider);
  } else if (isERC721) {
    return handleERC721Log(log, provider);
  } else if (isERC1155) {
    return handleERC1155Log(log, provider);
  }
};

const handleERC20Log = async (log: ethers.Log, provider: ethers.JsonRpcProvider) => {
  const [name, ticker, decimals, block, tx, receipt] = await Promise.all([
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("name") })
      .then(res => abiCoder.decode(["string"], res)[0]),
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("symbol") })
      .then(res => abiCoder.decode(["string"], res)[0]),
    provider
      .call({ to: log.address, data: ERC20Interface.encodeFunctionData("decimals") })
      .then(res => new BigNumber(res).toString()),
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[1])[0]);
  const to = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[2])[0]);
  const amount = BigInt(log.data === "0x" ? 0 : log.data).toString();

  const etherscanErc20Event: EtherscanERC20Event = {
    blockNumber: block?.number.toString() || "0",
    timeStamp: block?.timestamp.toString() || "0",
    hash: log.transactionHash,
    nonce: tx?.nonce.toString() || "0",
    blockHash: block?.hash || "",
    from,
    to,
    value: amount,
    tokenName: name,
    tokenSymbol: ticker,
    tokenDecimal: decimals,
    transactionIndex: block?.transactions.indexOf(log.transactionHash).toString() || "0",
    gas: tx?.gasLimit.toString() || "0",
    gasPrice: tx?.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt?.cumulativeGasUsed.toString() || "0",
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx?.data || "0x",
    confirmations: tx ? (await tx.confirmations()).toString() : "0",
    contractAddress: tx?.to!.toLowerCase() || "",
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
  const txHash = tx?.hash;
  const alreadyExistingOperation =
    (txHash && explorerLedgerOperationByAddress[from]!.get(txHash)) ||
    (txHash && explorerLedgerOperationByAddress[to]!.get(txHash));
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
        transaction_type: receipt?.type ?? 0,
        nonce: "",
        nonce_value: -1,
        value: tx?.value.toString() ?? "0",
        gas: tx?.gasLimit.toString() ?? "0",
        gas_price: receipt?.gasPrice.toString() ?? "0",
        max_fee_per_gas: tx?.type === 2 ? tx.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx?.type === 2 ? tx.maxPriorityFeePerGas!.toString() : null,
        from: tx?.from ?? "0x",
        to: tx?.to ?? "0x0000000000000000000000000000000000000000",
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
        confirmations: tx?.confirmations ? await tx.confirmations() : 0,
        input: null,
        gas_used: receipt?.gasUsed.toString() ?? "0",
        cumulative_gas_used: receipt?.cumulativeGasUsed.toString() ?? "0",
        status: receipt?.status ?? 0,
        received_at: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        block: {
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        },
      };
  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleERC721Log = async (log: ethers.Log, provider: ethers.JsonRpcProvider) => {
  const [block, tx, receipt] = await Promise.all([
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[1])[0]);
  const to = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[2])[0]);
  const tokenID = abiCoder.decode(["uint256"], log.topics[3])[0].toString();

  const erc721Event: EtherscanERC721Event = {
    blockNumber: block?.number.toString() || "0",
    timeStamp: block?.timestamp.toString() || "0",
    hash: tx?.hash || "",
    nonce: tx?.nonce.toString() || "0",
    blockHash: block?.hash || "",
    from,
    to,
    transactionIndex: block?.transactions.indexOf(log.transactionHash).toString() || "0",
    gas: tx?.gasLimit.toString() || "0",
    gasPrice: tx?.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt?.cumulativeGasUsed.toString() || "0",
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx?.data || "0x",
    confirmations: tx?.confirmations.toString() || "0",
    contractAddress: tx?.to ?? "0x0000000000000000000000000000000000000000",
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
  const txHash = tx?.hash;
  const alreadyExistingOperation =
    (txHash && explorerLedgerOperationByAddress[from]!.get(txHash)) ||
    (txHash && explorerLedgerOperationByAddress[to]!.get(txHash));
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
        transaction_type: receipt?.type ?? 0,
        nonce: "",
        nonce_value: -1,
        value: tx?.value.toString() ?? "0",
        gas: tx?.gasLimit.toString() ?? "0",
        gas_price: receipt?.gasPrice.toString() ?? "0",
        max_fee_per_gas: tx?.type === 2 ? tx?.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx?.type === 2 ? tx?.maxPriorityFeePerGas!.toString() : null,
        from: tx?.from ?? "0x",
        to: tx?.to ?? "0x0000000000000000000000000000000000000000",
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
        confirmations: tx?.confirmations ? await tx.confirmations() : 0,
        input: null,
        gas_used: receipt?.gasUsed.toString() ?? "0",
        cumulative_gas_used: receipt?.cumulativeGasUsed.toString() ?? "0",
        status: receipt?.status ?? 0,
        received_at: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        block: {
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        },
      };

  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleERC1155Log = async (log: ethers.Log, provider: ethers.JsonRpcProvider) => {
  const [block, tx, receipt] = await Promise.all([
    provider.getBlock(log.blockHash),
    provider.getTransaction(log.transactionHash),
    provider.getTransactionReceipt(log.transactionHash),
  ]);

  const from = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[2])[0]);
  const to = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[3])[0]);
  const operator = safeEncodeEIP55(abiCoder.decode(["address"], log.topics[1])[0]);

  const transfersMap: [string, string][] = abiCoder
    .decode(["uint256", "uint256"], log.data)
    .map((value, index) => [index === 0 ? "id" : "value", value.toString()]);

  const etherscanERC1155Events: EtherscanERC1155Event[] = transfersMap.map(([id, value]) => ({
    blockNumber: block?.number.toString() || "0",
    timeStamp: block?.timestamp.toString() || "0",
    hash: tx?.hash || "",
    nonce: tx?.nonce.toString() || "0",
    blockHash: block?.hash || "",
    from,
    to,
    transactionIndex: block?.transactions.indexOf(log.transactionHash).toString() || "0",
    gas: tx?.gasLimit.toString() || "0",
    gasPrice: tx?.gasPrice?.toString() || "",
    cumulativeGasUsed: receipt?.cumulativeGasUsed.toString() || "0",
    gasUsed: receipt?.gasUsed?.toString() || "0",
    input: tx?.data || "0x",
    confirmations: tx?.confirmations.toString() || "0",
    contractAddress: tx?.to ?? "0x0000000000000000000000000000000000000000",
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
  const txHash = tx?.hash;
  const alreadyExistingOperation =
    (txHash && explorerLedgerOperationByAddress[from]!.get(txHash)) ||
    (txHash && explorerLedgerOperationByAddress[to]!.get(txHash));
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
        hash: log.transactionHash || "",
        transaction_type: receipt?.type ?? 0,
        nonce: "",
        nonce_value: -1,
        value: tx?.value.toString() || "0",
        gas: tx?.gasLimit.toString() || "0",
        gas_price: receipt?.gasPrice.toString() || "0",
        max_fee_per_gas: tx?.type === 2 ? tx?.maxFeePerGas!.toString() : null,
        max_priority_fee_per_gas: tx?.type === 2 ? tx?.maxPriorityFeePerGas!.toString() : null,
        from: tx?.from ?? "0x",
        to: tx?.to ?? "0x0000000000000000000000000000000000000000",
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
        confirmations: tx?.confirmations ? await tx.confirmations() : 0,
        input: null,
        gas_used: receipt?.gasUsed.toString() || "0",
        cumulative_gas_used: receipt?.cumulativeGasUsed.toString() || "0",
        status: receipt?.status ?? 0,
        received_at: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        block: {
          hash: log.blockHash,
          height: log.blockNumber,
          time: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
        },
      };

  explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
  explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);
};

const handleBlock = async (blockNumber: number, provider: ethers.JsonRpcProvider) => {
  const block = await provider.getBlock(blockNumber, true);

  for (const transaction of block?.transactions || []) {
    const [tx, receipt, traces] = await Promise.all([
      provider.getTransaction(transaction),
      provider.getTransactionReceipt(transaction),
      provider.send("trace_transaction", [transaction]).catch(() => []) as Promise<
        TraceTransaction[]
      >,
    ]);

    const code = tx?.to ? await provider.getCode(tx?.to) : false;
    const from = safeEncodeEIP55(tx?.from || "");
    const to = safeEncodeEIP55(tx?.to || "");
    const etherscanOperation: EtherscanOperation = {
      blockNumber: block?.number.toString() || "0",
      timeStamp: block?.timestamp.toString() || "0",
      hash: tx?.hash || "",
      nonce: tx?.nonce.toString() || "0",
      blockHash: block?.hash || "",
      transactionIndex: block?.transactions.indexOf(transaction).toString() || "0",
      from,
      to,
      value: tx?.value.toString() || "0",
      gas: tx?.gasLimit.toString() || "0",
      gasPrice: tx?.gasPrice?.toString() || "",
      isError: receipt?.status === 1 ? "0" : "1",
      txreceipt_status: receipt?.status!.toString() || "0",
      input: tx?.data,
      contractAddress: code === "0x" ? "" : tx?.to ?? "0x0000000000000000000000000000000000000000",
      cumulativeGasUsed: receipt?.cumulativeGasUsed.toString() || "0",
      gasUsed: receipt?.gasUsed?.toString() || "0",
      confirmations: tx?.confirmations.toString() || "0",
      methodId: tx?.data && tx.data.length > 10 ? tx.data.slice(0, 10) : "",
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
      hash: receipt?.hash || "",
      transaction_type: receipt?.type || 0,
      nonce: "",
      nonce_value: -1,
      value: tx?.value.toString() || "0",
      gas: tx?.gasLimit.toString() || "0",
      gas_price: receipt?.gasPrice.toString() || "",
      max_fee_per_gas: tx?.type === 2 ? tx?.maxFeePerGas!.toString() : null,
      max_priority_fee_per_gas: tx?.type === 2 ? tx?.maxPriorityFeePerGas!.toString() : null,
      from: tx?.from || "",
      to: tx?.to ?? "0x0000000000000000000000000000000000000000",
      transfer_events: [],
      erc721_transfer_events: [],
      erc1155_transfer_events: [],
      approval_events: [],
      actions: [],
      confirmations: tx?.confirmations ? await tx.confirmations() : 0,
      input: null,
      gas_used: receipt?.gasUsed.toString() || "0",
      cumulative_gas_used: receipt?.cumulativeGasUsed.toString() || "0",
      status: receipt?.status ?? 0,
      received_at: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
      block: {
        hash: receipt?.blockHash || "",
        height: receipt?.blockNumber || 0,
        time: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
      },
    };
    explorerLedgerOperationByAddress[from]!.set(ledgerOperation.hash, ledgerOperation);
    explorerLedgerOperationByAddress[to]!.set(ledgerOperation.hash, ledgerOperation);

    for (const {
      traceAddress,
      action,
      result,
      type,
      transactionHash,
      transactionPosition,
    } of traces.filter(trace => trace.type === "call")) {
      /**
       * Empty `traceAddress` means this is a top-level operation
       * {@link https://www.alchemy.com/docs/reference/what-are-evm-traces?utm_source=chatgpt.com#how-to-read-traceaddress}
       */
      if (!traceAddress.length) continue;
      const code = action.to ? await provider.getCode(action.to) : false;
      const from = safeEncodeEIP55(action.from || "");
      const to = safeEncodeEIP55(action.to || "");
      const etherscanInternalTransaction: EtherscanInternalTransaction = {
        blockNumber: blockNumber.toString(),
        timeStamp: block?.timestamp.toString() || "0",
        hash: transactionHash,
        from,
        to,
        value: BigInt(action.value).toString() || "0",
        contractAddress: code === "0x" ? "" : action.to!,
        input: action.input || "0x",
        type,
        gas: BigInt(action.gas).toString(),
        gasUsed: BigInt(result?.gasUsed || "0").toString(),
        traceId: transactionPosition.toString(),
        isError: receipt?.status === 1 ? "0" : "1",
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
      const txHash = tx?.hash;
      const alreadyExistingOperation =
        (txHash && explorerLedgerOperationByAddress[from]!.get(txHash)) ||
        (txHash && explorerLedgerOperationByAddress[to]!.get(txHash));
      const ledgerOperation: LedgerExplorerOperation = alreadyExistingOperation
        ? {
            ...alreadyExistingOperation,
            actions: [
              ...alreadyExistingOperation.actions,
              {
                from,
                to,
                input: null,
                value: BigInt(action.value).toString(),
                gas: BigInt(action.gas).toString(),
                gas_used: BigInt(result?.gasUsed || "0").toString(),
                error: null,
              },
            ],
          }
        : {
            hash: receipt?.hash || "",
            transaction_type: receipt?.type ?? 0,
            nonce: "",
            nonce_value: -1,
            value: tx?.value.toString() || "0",
            gas: tx?.gasLimit.toString() || "0",
            gas_price: receipt?.gasPrice.toString() || "0",
            max_fee_per_gas: tx?.type === 2 ? tx?.maxFeePerGas!.toString() : null,
            max_priority_fee_per_gas: tx?.type === 2 ? tx?.maxPriorityFeePerGas!.toString() : null,
            from: tx?.from || "0x",
            to: tx?.to ?? "0x0000000000000000000000000000000000000000",
            transfer_events: [],
            erc721_transfer_events: [],
            erc1155_transfer_events: [],
            approval_events: [],
            actions: [
              {
                from,
                to,
                input: null,
                value: BigInt(action.value).toString(),
                gas: BigInt(action.gas).toString(),
                gas_used: BigInt(result?.gasUsed || "0").toString(),
                error: null,
              },
            ],
            confirmations: tx?.confirmations ? await tx.confirmations() : 0,
            input: null,
            gas_used: receipt?.gasUsed.toString() || "0",
            cumulative_gas_used: receipt?.cumulativeGasUsed.toString() || "0",
            status: receipt?.status ?? 0,
            received_at: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
            block: {
              hash: receipt?.blockHash || "",
              height: receipt?.blockNumber || 0,
              time: new Date((block?.timestamp ?? 0) * 1000).toISOString(),
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

export const indexBlocks = async (chainId: number) => {
  if (!fromBlock) {
    throw new Error("fromBlock is not set");
  }
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545", chainId, {
    staticNetwork: true,
  });
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
  await promiseAllBatched(10, blocks, async blockNumber =>
    Promise.all([
      handleBlock(blockNumber, provider),
      new Promise(resolve => setTimeout(resolve, 500)),
    ]),
  );
  await promiseAllBatched(10, logs, async log =>
    Promise.all([handleLog(log, provider), new Promise(resolve => setTimeout(resolve, 500))]),
  );

  latestBlockNumber = await provider.getBlockNumber();
  setBlock(Math.min(toBlock, latestBlockNumber));

  console.log(`Indexing completed ✓`);
};

let server: SetupServerApi;
export const initMswHandlers = (currencyConfig: EvmConfigInfo) => {
  const handlers = [
    http.get("https://crypto-assets-service.api.ledger.com/v1/currencies", ({ request }) => {
      const response: Array<{ id: string; type: string }> = [];
      const url = new URL(request.url);
      const id = url.searchParams.get("id");

      switch (id) {
        case "ethereum":
        case "sonic":
        case "polygon":
        case "core":
        case "blast":
        case "scroll":
        case "bsc":
          response.push({ id, type: "coin" });
      }

      return HttpResponse.json(response, { headers: { "X-Ledger-Commit": "hash" } });
    }),
    http.get("https://crypto-assets-service.api.ledger.com/v1/tokens", ({ request }) => {
      const response: Array<{
        id: string;
        contract_address: string;
        ticker: string;
        name: string;
        units: Array<{ code: string; name: string; magnitude: number }>;
        delisted: boolean;
        standard: string;
        decimals: number;
      }> = [];
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      const contractAddress = url.searchParams.get("contract_address");
      const network = url.searchParams.get("network");

      if (
        id === "ethereum/erc20/usd__coin" ||
        (contractAddress === "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" && network === "ethereum")
      ) {
        response.push({
          id: "ethereum/erc20/usd__coin",
          contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          ticker: "USDC",
          name: "USD Coin",
          units: [
            {
              code: "USDC",
              name: "USDC",
              magnitude: 6,
            },
          ],
          delisted: false,
          standard: "erc20",
          decimals: 6,
        });
      } else if (
        id === "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894" ||
        (contractAddress === "0x29219dd400f2Bf60E5a23d13Be72B486D4038894" && network === "sonic")
      ) {
        response.push({
          id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
          contract_address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
          ticker: "USDC.e",
          name: "Bridged USDC (Sonic Labs)",
          units: [
            {
              code: "USDC.e",
              name: "USDC.e",
              magnitude: 6,
            },
          ],
          delisted: false,
          standard: "erc20",
          decimals: 6,
        });
      } else if (
        id === "polygon/erc20/usd_coin_(pos)" ||
        (contractAddress === "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" && network === "polygon")
      ) {
        response.push({
          id: "polygon/erc20/usd_coin_(pos)",
          contract_address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          ticker: "USDC",
          name: "USD Coin (PoS)",
          units: [
            {
              code: "USDC",
              name: "USDC",
              magnitude: 6,
            },
          ],
          delisted: false,
          standard: "erc20",
          decimals: 6,
        });
      } else if (
        id === "scroll/erc20/usd_coin" ||
        (contractAddress === "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4" && network === "scroll")
      ) {
        response.push({
          id: "scroll/erc20/usd_coin",
          contract_address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
          ticker: "USDC",
          name: "USD Coin",
          units: [
            {
              code: "USDC",
              name: "USDC",
              magnitude: 6,
            },
          ],
          delisted: false,
          standard: "erc20",
          decimals: 6,
        });
      } else if (
        id === "blast/erc20/magic_internet_money" ||
        (contractAddress === "0x76DA31D7C9CbEAE102aff34D3398bC450c8374c1" && network === "blast")
      ) {
        response.push({
          id: "blast/erc20/magic_internet_money",
          contract_address: "0x76DA31D7C9CbEAE102aff34D3398bC450c8374c1",
          ticker: "MIM",
          name: "Magic Internet Money",
          units: [
            {
              code: "MIM",
              name: "MIM",
              magnitude: 18,
            },
          ],
          delisted: false,
          standard: "erc20",
          decimals: 18,
        });
      } else if (
        id === "bsc/bep20/binance-peg_bsc-usd" ||
        (contractAddress === "0x55d398326f99059fF775485246999027B3197955" && network === "bsc")
      ) {
        response.push({
          id: "bsc/bep20/binance-peg_bsc-usd",
          contract_address: "0x55d398326f99059fF775485246999027B3197955",
          ticker: "USDC",
          name: "USD Coin (PoS)",
          units: [
            {
              code: "USDC",
              name: "USDC",
              magnitude: 18,
            },
          ],
          delisted: false,
          standard: "bep20",
          decimals: 18,
        });
      }

      return HttpResponse.json(response, { headers: { "X-Ledger-Commit": "hash" } });
    }),
    http.get<{ explorerId: "eth" | "matic" | "bnb" }>(
      "https://explorers.api.live.ledger.com/blockchain/v4/:explorerId/gastracker/barometer",
      ({ params }) => {
        if (!["eth", "matic", "bnb"].includes(params.explorerId)) {
          return new HttpResponse(null, { status: 404 });
        }

        const values = {
          eth: {
            low: "111026756",
            medium: "767080567",
            high: "5141064700",
            next_base: "4412356062",
          },
          matic: {
            low: "59808980000",
            medium: "60298094285",
            high: "311646840394",
            next_base: "599841329007",
          },
          bnb: {
            low: "50000000",
            medium: "51607000",
            high: "143750000",
            next_base: null,
          },
        };

        return HttpResponse.json(values[params.explorerId]);
      },
    ),
    // called by `provider.getFeeData()` inside `callMyDealer` for Polygon
    http.get("https://gasstation.polygon.technology/v2", () =>
      HttpResponse.json({
        safeLow: {
          maxPriorityFee: 29.659782351,
          maxFee: 340.836669186,
        },
        standard: {
          maxPriorityFee: 44.539955298,
          maxFee: 355.716842133,
        },
        fast: {
          maxPriorityFee: 87.14945324,
          maxFee: 398.326340075,
        },
        estimatedBaseFee: 311.176886835,
        blockTime: 2,
        blockNumber: 82290307,
      }),
    ),
  ];

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
  server.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error("Unhandled request");
    },
  });
};
