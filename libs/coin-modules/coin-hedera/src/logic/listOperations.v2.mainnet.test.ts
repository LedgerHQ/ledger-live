import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { apiClient } from "../network/api";
import { hgraphClient } from "../network/hgraph";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import mainnetCases from "../test/fixtures/mainnet-edge-cases.json";
import type {
  ERC20TokenTransfer,
  HederaMirrorContractCallResult,
  HederaMirrorTransaction,
} from "../types";
import { listOperationsV2 } from "./listOperations.v2";

// Real mainnet transactions that broke operation parsing at some point, recorded with
// libs/ledger-live-common/hedera-nonreg/capture.py: the account-filtered mirror records of each
// transaction and, for ERC20 transactions, the hgraph rows with the parent record they enrich.

jest.mock("../network/api");
jest.mock("../network/hgraph");
jest.mock("../network/utils", () => ({
  ...jest.requireActual("../network/utils"),
  enrichERC20Transfers: jest.fn(),
  analyzeStakingOperation: jest.fn(),
}));

type MainnetCase = {
  name: string;
  account: string;
  evmAddress: string;
  records: HederaMirrorTransaction[];
  erc20?: {
    parent: HederaMirrorTransaction;
    contractCallResult: HederaMirrorContractCallResult;
    transfers: ERC20TokenTransfer[];
  };
};

const cases = mainnetCases as unknown as MainnetCase[];

function findCase(name: string): MainnetCase {
  const found = cases.find(c => c.name === name);
  if (!found) throw new Error(`no mainnet case named "${name}"`);
  return found;
}

async function listCaseOperations(mainnetCase: MainnetCase) {
  const { account, evmAddress, records, erc20 } = mainnetCase;

  (apiClient.getAccountTransactions as jest.Mock).mockResolvedValue({
    transactions: records,
    nextCursor: null,
  });
  (hgraphClient.getERC20Transfers as jest.Mock).mockResolvedValue(erc20?.transfers ?? []);
  (hgraphClient.getLatestIndexedConsensusTimestamp as jest.Mock).mockResolvedValue(
    new BigNumber("9999999999").times(10 ** 9),
  );
  (networkUtils.enrichERC20Transfers as jest.Mock).mockResolvedValue(
    erc20
      ? [
          {
            transfers: erc20.transfers,
            contractCallResult: erc20.contractCallResult,
            mirrorTransaction: erc20.parent,
          },
        ]
      : [],
  );

  const result = await listOperationsV2(getMockedConfig(), {
    currencyId: "hedera",
    address: account,
    evmAddress,
    mirrorTokens: [],
    tokenEvmAddresses: [...new Set(erc20?.transfers.map(t => t.token_evm_address) ?? [])],
    fetchAllPages: true,
    skipFeesForTokenOperations: false,
    useEncodedHash: false,
    useSyntheticBlocks: true,
  });

  return [...result.coinOperations, ...result.tokenOperations];
}

function addTo(movements: Map<string, BigNumber>, asset: string, amount: BigNumber.Value) {
  movements.set(asset, (movements.get(asset) ?? new BigNumber(0)).plus(amount));
}

/** what moved for the account on chain, per asset: HBAR, HTS token id or ERC20 address */
function chainMovements({ account, records, erc20 }: MainnetCase): Map<string, BigNumber> {
  const movements = new Map<string, BigNumber>();
  const byTimestamp = new Map(records.map(r => [r.consensus_timestamp, r]));
  // a relayer's ETHEREUMTRANSACTION is not listed for the account, which may still pay part of it
  if (erc20) byTimestamp.set(erc20.parent.consensus_timestamp, erc20.parent);

  for (const record of byTimestamp.values()) {
    for (const t of record.transfers ?? []) {
      if (t.account === account) addTo(movements, "native", t.amount);
    }
    for (const t of record.token_transfers ?? []) {
      if (t.account === account) addTo(movements, t.token_id, t.amount);
    }
  }

  const accountNum = Number(account.split(".")[2]);
  for (const row of erc20?.transfers ?? []) {
    if (row.receiver_account_id === accountNum) addTo(movements, row.token_evm_address, row.amount);
    if (row.sender_account_id === accountNum) addTo(movements, row.token_evm_address, -row.amount);
  }

  return movements;
}

/** what the operations say moved, signed the way an account's history and balance read them */
function operationMovements(operations: Operation[]): Map<string, BigNumber> {
  const movements = new Map<string, BigNumber>();

  for (const op of operations) {
    if (op.type === "NONE") continue;
    const incoming = op.type === "IN" || op.type === "REWARD";
    // an ERC20 transfer's FEES op names the token it paid for, but it moves HBAR
    const asset = op.type === "FEES" ? "native" : (op.contract ?? "native");
    addTo(movements, asset, incoming ? op.value : op.value.negated());
  }

  return movements;
}

function withoutZeros(movements: Map<string, BigNumber>): Record<string, string> {
  return Object.fromEntries(
    [...movements]
      .filter(([, amount]) => !amount.isZero())
      .map(([asset, a]) => [asset, a.toFixed()]),
  );
}

describe("listOperationsV2 on mainnet edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (networkUtils.analyzeStakingOperation as jest.Mock).mockResolvedValue(null);
  });

  it.each(cases.map(c => [c.name, c] as const))(
    "%s: the operations add up to what moved for the account",
    async (_, mainnetCase) => {
      const operations = await listCaseOperations(mainnetCase);

      expect(withoutZeros(operationMovements(operations))).toEqual(
        withoutZeros(chainMovements(mainnetCase)),
      );
    },
  );

  it.each(cases.map(c => [c.name, c] as const))(
    "%s: every operation has its own id and every fee names its collector",
    async (_, mainnetCase) => {
      const operations = await listCaseOperations(mainnetCase);
      const ids = operations.map(op => op.id);

      expect(new Set(ids).size).toBe(ids.length);
      const fees = operations.filter(op => op.type === "FEES");
      expect(fees.filter(fee => fee.recipients.length === 0)).toEqual([]);
    },
  );

  it("splits a send to several recipients into one OUT each, plus the fee", async () => {
    const operations = await listCaseOperations(
      findCase("send to eight recipients, fee to the fee collection account"),
    );

    expect(operations.filter(op => op.type === "OUT")).toHaveLength(8);
    expect(operations.filter(op => op.type === "FEES")).toHaveLength(1);
  });

  it("reports HBAR a swap pays out to the account as received, not as a contract call", async () => {
    const operations = await listCaseOperations(
      findCase("HTS swap paid by the account that pays HBAR out to it"),
    );

    expect(operations.filter(op => !op.contract).map(op => op.type)).toEqual(
      expect.arrayContaining(["IN", "FEES"]),
    );
    expect(operations.some(op => op.type === "CONTRACT_CALL")).toBe(false);
  });

  it("sums ERC20 rows to the same recipient and charges no fee for a relayed tx", async () => {
    const operations = await listCaseOperations(
      findCase("relayed EVM tx: wBTC rows to the same recipient, USDC back in child records"),
    );
    const wbtc = operations.filter(
      op => op.contract === "0xd7d4d91d64a6061fa00a94e2b3a2d2a5fb677849",
    );

    expect(wbtc.map(op => op.value.toFixed()).sort()).toEqual(["152000", "182"]);
    expect(operations.some(op => op.type === "FEES")).toBe(false);
  });

  it("keeps the HBAR side of an ERC20 sold for HBAR", async () => {
    const operations = await listCaseOperations(
      findCase("ERC20 sold for HBAR in one contract call"),
    );

    expect(operations.filter(op => !op.contract)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "IN", value: new BigNumber(95138768148) }),
      ]),
    );
  });

  it("charges the signer of a failed EVM tx its share of the gas", async () => {
    const operations = await listCaseOperations(
      findCase("failed EVM tx, signer side of the split gas"),
    );

    expect(operations).toMatchObject([
      { type: "OUT", hasFailed: true, value: new BigNumber(4181400), fee: new BigNumber(4181400) },
    ]);
  });

  it("addresses a child record's fee to the fee collection account", async () => {
    const operations = await listCaseOperations(
      findCase("child record whose fee goes to the fee collection account"),
    );

    expect(operations.filter(op => op.type === "FEES")).toMatchObject([
      { recipients: ["0.0.802"] },
    ]);
  });

  it("charges no fee to an allowance owner whose spender paid it", async () => {
    const operations = await listCaseOperations(
      findCase("allowance: the owner's HBAR moved by a spender who pays the fee"),
    );

    expect(operations.every(op => op.fee.isZero())).toBe(true);
  });

  it("reports nothing for a DUPLICATE_TRANSACTION record", async () => {
    const operations = await listCaseOperations(
      findCase("DUPLICATE_TRANSACTION record that moves nothing"),
    );

    expect(operations).toEqual([]);
  });
});
