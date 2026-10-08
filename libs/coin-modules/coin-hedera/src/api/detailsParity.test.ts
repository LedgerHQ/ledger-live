import type {
  BlockTransaction,
  Operation,
  OtherBlockOperation,
} from "@ledgerhq/coin-module-framework/api/types";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { HEDERA_TRANSACTION_NAMES, STAKING_REWARD_ACCOUNT_ID } from "../constants";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlockV2 } from "../logic/lastBlock.v2";
import { getSyntheticBlock } from "../logic/utils";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import {
  analyzeStakingOperation,
  enrichERC20Transfers,
  getERC20BalancesForAccountV2,
} from "../network/utils";
import { getMockedEnrichedERC20Transfer } from "../test/fixtures/common.fixture";
import { getMockedContext } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { getMockedERC20TokenTransfer } from "../test/fixtures/hgraph.fixture";
import {
  getMockedMirrorAccount,
  getMockedMirrorContractCallResult,
  getMockedMirrorToken,
  getMockedMirrorTransaction,
} from "../test/fixtures/mirror.fixture";
import type {
  EnrichedERC20Transfer,
  HederaMirrorToken,
  HederaMirrorTransaction,
  StakingAnalysis,
} from "../types";
import { createApi } from "./index";

// Only the network is mocked: both paths run their real mapping, so this suite fails as soon as
// `getBlock` and `listOperations` describe the same transaction differently.
jest.mock("../logic/getBlockInfo");
jest.mock("../logic/lastBlock.v2");
jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  analyzeStakingOperation: jest.fn(),
  enrichERC20Transfers: jest.fn(),
  getERC20BalancesForAccountV2: jest.fn(),
}));

const ACCOUNT = getMockedMirrorAccount({
  account: "0.0.12345",
  evm_address: "0x0000000000000000000000000000000000012345",
});
const PEER = "0.0.67890";
const NODE = "0.0.3";
const FEE = 100_000;
const TIMESTAMP = "1704067210.123456789";
const TRANSACTION_ID = `${ACCOUNT.account}-1704067200-000000000`;

// `listOperations` ledgerOpTypes that `getBlock` emits as an "other" operation
const OTHER_OP_TYPES = new Set(["ASSOCIATE_TOKEN", "DELEGATE", "UNDELEGATE", "REDELEGATE"]);

type Scenario = {
  name: string;
  mirrorTx: HederaMirrorTransaction;
  erc20?: EnrichedERC20Transfer;
  mirrorTokens?: HederaMirrorToken[];
  stakingAnalysis?: StakingAnalysis;
  expectedTypes: string[];
};

const baseTx = (overrides: Partial<HederaMirrorTransaction>) =>
  getMockedMirrorTransaction({
    transaction_id: TRANSACTION_ID,
    transaction_hash: "parity_hash",
    consensus_timestamp: TIMESTAMP,
    charged_tx_fee: FEE,
    node: NODE,
    ...overrides,
  });

const stakingScenario = (analysis: StakingAnalysis): Scenario => ({
  name: analysis.operationType,
  mirrorTx: baseTx({
    name: HEDERA_TRANSACTION_NAMES.UpdateAccount,
    transfers: [
      { account: ACCOUNT.account, amount: -FEE },
      { account: NODE, amount: FEE },
    ],
  }),
  stakingAnalysis: analysis,
  expectedTypes: [analysis.operationType],
});

const contractCallResult = getMockedMirrorContractCallResult({
  gas_consumed: 75_000,
  gas_limit: 100_000,
  gas_used: 75_000,
});
const erc20MirrorTx = baseTx({
  name: HEDERA_TRANSACTION_NAMES.ContractCall,
  transfers: [
    { account: ACCOUNT.account, amount: -FEE },
    { account: NODE, amount: FEE },
  ],
});

const scenarios: Scenario[] = [
  {
    name: "HBAR transfer with memo",
    mirrorTx: baseTx({
      memo_base64: Buffer.from("parity memo").toString("base64"),
      transfers: [
        { account: ACCOUNT.account, amount: -1000 - FEE },
        { account: PEER, amount: 1000 },
        { account: NODE, amount: FEE },
      ],
    }),
    expectedTypes: ["OUT"],
  },
  {
    name: "HTS token transfer",
    mirrorTx: baseTx({
      transfers: [
        { account: ACCOUNT.account, amount: -FEE },
        { account: NODE, amount: FEE },
      ],
      token_transfers: [
        { token_id: "0.0.5022567", account: ACCOUNT.account, amount: -5 },
        { token_id: "0.0.5022567", account: PEER, amount: 5 },
      ],
    }),
    expectedTypes: ["OUT"],
  },
  {
    name: "ERC20 token transfer",
    mirrorTx: erc20MirrorTx,
    erc20: getMockedEnrichedERC20Transfer({
      mirrorTransaction: erc20MirrorTx,
      contractCallResult,
      transfers: [
        getMockedERC20TokenTransfer({
          token_evm_address: "0x0000000000000000000000000000000000001001",
          transaction_hash: erc20MirrorTx.transaction_hash,
          consensus_timestamp: Number(TIMESTAMP.split(".")[0]) * 10 ** 9,
          sender_account_id: 12345,
          receiver_account_id: 67890,
          sender_evm_address: ACCOUNT.evm_address,
          receiver_evm_address: "0x0000000000000000000000000000000000067890",
          amount: 7_770_000,
        }),
      ],
    }),
    expectedTypes: ["OUT"],
  },
  {
    name: "ASSOCIATE_TOKEN",
    mirrorTx: baseTx({
      name: HEDERA_TRANSACTION_NAMES.TokenAssociate,
      transfers: [
        { account: ACCOUNT.account, amount: -FEE },
        { account: NODE, amount: FEE },
      ],
    }),
    mirrorTokens: [getMockedMirrorToken({ token_id: "0.0.456858", created_timestamp: TIMESTAMP })],
    expectedTypes: ["ASSOCIATE_TOKEN"],
  },
  stakingScenario({
    operationType: "DELEGATE",
    previousStakingNodeId: null,
    targetStakingNodeId: 34,
    stakedAmount: BigInt(21083322293),
  }),
  stakingScenario({
    operationType: "UNDELEGATE",
    previousStakingNodeId: 22,
    targetStakingNodeId: null,
    stakedAmount: BigInt(21083441623),
  }),
  stakingScenario({
    operationType: "REDELEGATE",
    previousStakingNodeId: 34,
    targetStakingNodeId: 6,
    stakedAmount: BigInt(21083202902),
  }),
  {
    name: "staking reward",
    mirrorTx: baseTx({
      transfers: [
        { account: ACCOUNT.account, amount: -1000 - FEE + 3235 },
        { account: PEER, amount: 1000 },
        { account: NODE, amount: FEE },
        { account: STAKING_REWARD_ACCOUNT_ID, amount: -3235 },
      ],
      staking_reward_transfers: [{ account: ACCOUNT.account, amount: 3235 }],
    }),
    expectedTypes: ["OUT", "REWARD"],
  },
];

/** The part of `listOperations` details that `getBlock` must reproduce. */
function historyView(op: Operation) {
  const { memo, ledgerOpType, stakedAmount, familyExtra } = op.details ?? {};
  return {
    memo,
    familyExtra,
    ...(OTHER_OP_TYPES.has(String(ledgerOpType)) && { ledgerOpType, stakedAmount }),
  };
}

/**
 * The same view rebuilt from a block: transaction details, overlaid with the "other" operation's
 * own keys when the history operation maps to one.
 */
function blockView(tx: BlockTransaction, op: Operation) {
  const otherOp: Record<string, unknown> =
    tx.operations.find(
      (o): o is OtherBlockOperation =>
        o.type === "other" && o.ledgerOpType === op.details?.ledgerOpType,
    ) ?? {};
  const { familyExtra: txFamilyExtra, ...txDetails } = tx.details ?? {};
  const { type: _type, familyExtra: opFamilyExtra, ...opDetails } = otherOp;
  const familyExtra = {
    ...(txFamilyExtra as Record<string, unknown> | undefined),
    ...(opFamilyExtra as Record<string, unknown> | undefined),
  };

  return {
    ...txDetails,
    ...opDetails,
    familyExtra: Object.keys(familyExtra).length > 0 ? familyExtra : undefined,
  };
}

describe("getBlock and listOperations details parity", () => {
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
    jest
      .mocked(apiClient.getAccount)
      .mockResolvedValue({ ...ACCOUNT, created_timestamp: "1704000000.000000000" });
    jest.mocked(getERC20BalancesForAccountV2).mockResolvedValue([]);
    jest
      .mocked(hgraphClient.getLatestIndexedConsensusTimestamp)
      .mockResolvedValue(new BigNumber("9999999999000000000"));
    jest.mocked(hgraphClient.getERC20Transfers).mockResolvedValue([]);
    jest.mocked(hgraphClient.getERC20TransfersByTimestampRange).mockResolvedValue([]);
  });

  it.each(scenarios)(
    "describes a $name the same way from both paths",
    async ({ mirrorTx, erc20, mirrorTokens = [], stakingAnalysis, expectedTypes }) => {
      jest.mocked(apiClient.getAccountTokens).mockResolvedValue(mirrorTokens);
      jest
        .mocked(apiClient.getAccountTransactions)
        .mockResolvedValue({ transactions: [mirrorTx], nextCursor: null });
      jest.mocked(apiClient.getTransactionsByTimestampRange).mockResolvedValue([mirrorTx]);
      jest.mocked(enrichERC20Transfers).mockResolvedValue(erc20 ? [erc20] : []);
      jest.mocked(analyzeStakingOperation).mockResolvedValue(stakingAnalysis ?? null);

      const [{ items: history }, block] = await Promise.all([
        api.listOperations(context, ACCOUNT.account, { minHeight: 0, order: "desc" }),
        api.getBlock(context, height),
      ]);

      const blockTx = block.transactions.find(tx => tx.hash === mirrorTx.transaction_hash);
      invariant(blockTx, `getBlock is missing ${mirrorTx.transaction_hash}`);
      expect(history.map(op => op.type).sort()).toEqual(expectedTypes);
      for (const op of history) {
        expect(op.tx.hash).toBe(mirrorTx.transaction_hash);
        expect(blockView(blockTx, op)).toEqual(historyView(op));
      }
    },
  );
});
