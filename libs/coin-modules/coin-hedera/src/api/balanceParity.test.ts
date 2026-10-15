import type { BlockTransaction, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { HEDERA_TRANSACTION_NAMES, STAKING_REWARD_ACCOUNT_ID } from "../constants";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlockV2 } from "../logic/lastBlock.v2";
import { getSyntheticBlock } from "../logic/utils";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import { enrichERC20Transfers, getERC20BalancesForAccountV2 } from "../network/utils";
import { getMockedContext } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import {
  getMockedMirrorAccount,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import type { HederaMirrorTransaction } from "../types";
import { createApi } from "./index";

// Only the network is mocked: both paths run their real mapping. Summing what either path gives an account
// (values and the fees it paid) must give the account's HBAR change on chain.
jest.mock("../logic/getBlockInfo");
jest.mock("../logic/lastBlock.v2");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  enrichERC20Transfers: jest.fn(),
  getERC20BalancesForAccountV2: jest.fn(),
}));

const ACCOUNT = "0.0.12345";
const PEER = "0.0.67890";
const CONTRACT = "0.0.1077627";
const NODE = "0.0.3";
const FEE = 100_000;
const TIMESTAMP = "1704067210.123456789";

type Scenario = {
  name: string;
  mirrorTx: HederaMirrorTransaction;
  addresses: string[];
};

const baseTx = (initiator: string, overrides: Partial<HederaMirrorTransaction>) =>
  getMockedMirrorTransaction({
    transaction_id: `${initiator}-1704067200-000000000`,
    transaction_hash: "parity_hash",
    consensus_timestamp: TIMESTAMP,
    charged_tx_fee: FEE,
    node: NODE,
    ...overrides,
  });

const scenarios: Scenario[] = [
  {
    name: "HBAR transfer paid by its sender",
    mirrorTx: baseTx(ACCOUNT, {
      transfers: [
        { account: ACCOUNT, amount: -1000 - FEE },
        { account: PEER, amount: 1000 },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT, PEER],
  },
  {
    name: "HBAR transfer paid by another account",
    mirrorTx: baseTx(CONTRACT, {
      transfers: [
        { account: ACCOUNT, amount: -1000 },
        { account: PEER, amount: 1000 },
        { account: CONTRACT, amount: -FEE },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT, PEER, CONTRACT],
  },
  {
    // mirror node transaction 0.0.453351-1665468776-125049344
    name: "contract call whose fees the contract partly paid",
    mirrorTx: baseTx("0.0.453351", {
      name: HEDERA_TRANSACTION_NAMES.ContractCall,
      charged_tx_fee: 35040000,
      transfers: [
        { account: "0.0.98", amount: 35040000 },
        { account: "0.0.453351", amount: -34507603 },
        { account: CONTRACT, amount: -532397 },
      ],
    }),
    addresses: ["0.0.453351", CONTRACT],
  },
  {
    name: "contract call that pays HBAR back to its fee payer",
    mirrorTx: baseTx(ACCOUNT, {
      name: HEDERA_TRANSACTION_NAMES.ContractCall,
      transfers: [
        { account: ACCOUNT, amount: 500_000 - FEE },
        { account: CONTRACT, amount: -500_000 },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT, CONTRACT],
  },
  {
    name: "contract call that pays HBAR to an account that did not call it",
    mirrorTx: baseTx(PEER, {
      name: HEDERA_TRANSACTION_NAMES.ContractCall,
      transfers: [
        { account: PEER, amount: -FEE },
        { account: CONTRACT, amount: -500_000 },
        { account: ACCOUNT, amount: 500_000 },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT, PEER, CONTRACT],
  },
  {
    name: "HBAR transfer to its fee payer, through an allowance",
    mirrorTx: baseTx(ACCOUNT, {
      transfers: [
        { account: PEER, amount: -500_000 },
        { account: ACCOUNT, amount: 500_000 - FEE },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT, PEER],
  },
  {
    name: "failed HBAR transfer",
    mirrorTx: baseTx(ACCOUNT, {
      result: "INSUFFICIENT_ACCOUNT_BALANCE",
      transfers: [
        { account: ACCOUNT, amount: -FEE },
        { account: NODE, amount: FEE },
      ],
    }),
    addresses: [ACCOUNT],
  },
  {
    name: "HBAR transfer that collects a staking reward",
    mirrorTx: baseTx(ACCOUNT, {
      transfers: [
        { account: ACCOUNT, amount: -1000 - FEE + 3235 },
        { account: PEER, amount: 1000 },
        { account: NODE, amount: FEE },
        { account: STAKING_REWARD_ACCOUNT_ID, amount: -3235 },
      ],
      staking_reward_transfers: [{ account: ACCOUNT, amount: 3235 }],
    }),
    addresses: [ACCOUNT, PEER],
  },
];

const isNative = (op: Operation) => op.asset.type === "native";

/** The HBAR change summed from `listOperations`, whose values exclude fees. */
function historyChange(address: string, operations: Operation[]): bigint {
  const transfers = operations.filter(isNative).reduce((sum, op) => {
    const isSender = op.senders.includes(address);
    const isRecipient = op.recipients.includes(address);
    switch (op.type) {
      case "IN":
      case "REWARD":
        return sum + op.value;
      case "OUT":
        return sum - op.value;
      case "CONTRACT_CALL":
        return isRecipient && !isSender ? sum + op.value : sum - op.value;
      default:
        return sum;
    }
  }, BigInt(0));
  // fees are taken once per transaction, from its largest operation fee
  const opsByHash = new Map<string, Operation[]>();
  for (const op of operations) {
    opsByHash.set(op.tx.hash, [...(opsByHash.get(op.tx.hash) ?? []), op]);
  }
  const fees = [...opsByHash.values()].reduce((sum, ops) => {
    const feesPayer = ops.find(op => op.tx.feesPayer)?.tx.feesPayer;
    const fee = ops.reduce((max, op) => (op.tx.fees > max ? op.tx.fees : max), BigInt(0));
    return feesPayer === address ? sum + fee : sum;
  }, BigInt(0));

  return transfers - fees;
}

/** The HBAR change summed from `getBlock`. */
function blockChange(address: string, tx: BlockTransaction): bigint {
  const transfers = tx.operations.reduce(
    (sum, op) =>
      op.type === "transfer" && op.address === address && op.asset.type === "native"
        ? sum + op.amount
        : sum,
    BigInt(0),
  );

  return tx.feesPayer === address ? transfers - tx.fees : transfers;
}

describe("getBlock and listOperations balance parity", () => {
  const api = createApi(getMockedCurrency().id);
  const context = getMockedContext();
  const height = getSyntheticBlock(TIMESTAMP).blockHeight;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(getBlockInfo).mockResolvedValue({ height, hash: "block_hash", time: new Date() });
    jest.mocked(lastBlockV2).mockResolvedValue({
      height: height + 1000,
      hash: "last_block_hash",
      time: new Date(),
    });
    jest.mocked(apiClient.getAccountTokens).mockResolvedValue([]);
    jest.mocked(getERC20BalancesForAccountV2).mockResolvedValue([]);
    jest.mocked(enrichERC20Transfers).mockResolvedValue([]);
    jest
      .mocked(hgraphClient.getLatestIndexedConsensusTimestamp)
      .mockResolvedValue(new BigNumber("9999999999000000000"));
    jest.mocked(hgraphClient.getERC20Transfers).mockResolvedValue([]);
    jest.mocked(hgraphClient.getERC20TransfersByTimestampRange).mockResolvedValue([]);
  });

  it.each(
    scenarios.flatMap(scenario => scenario.addresses.map(address => ({ ...scenario, address }))),
  )(
    "gives $address of a $name its on-chain HBAR change from both paths",
    async ({ mirrorTx, address }) => {
      jest.mocked(apiClient.getAccount).mockResolvedValue(
        getMockedMirrorAccount({
          account: address,
          evm_address: "0x0000000000000000000000000000000000012345",
          created_timestamp: "1704000000.000000000",
        }),
      );
      jest
        .mocked(apiClient.getAccountTransactions)
        .mockResolvedValue({ transactions: [mirrorTx], nextCursor: null });
      jest.mocked(apiClient.getTransactionsByTimestampRange).mockResolvedValue([mirrorTx]);

      const [{ items: history }, block] = await Promise.all([
        api.listOperations(context, address, { minHeight: 0, order: "desc" }),
        api.getBlock(context, height),
      ]);

      const blockTx = block.transactions.find(tx => tx.hash === mirrorTx.transaction_hash);
      invariant(blockTx, `getBlock is missing ${mirrorTx.transaction_hash}`);
      const onChainChange = BigInt(
        mirrorTx.transfers
          .filter(transfer => transfer.account === address)
          .reduce((sum, transfer) => sum + transfer.amount, 0),
      );

      expect(historyChange(address, history)).toBe(onChainChange);
      expect(blockChange(address, blockTx)).toBe(onChainChange);
    },
  );
});
