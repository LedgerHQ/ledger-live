import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { makeGetAccountShape } from "../../bridge/sync";
import * as gateway from "../../network/gateway";
import resolver from "../../signer";
import {
  createMockCantonCurrency,
  createMockCoinConfigValue,
  createMockContext,
  createMockPendingTransferProposal,
} from "../../test/fixtures";
import * as balance from "../getBalance";
import { getAccountStatus } from "../getAccountStatus";
import { TopologyChangeError } from "../../types/errors";

jest.mock("../../network/gateway", () => ({
  ...jest.requireActual("../../network/gateway"),
  getPartyByPubKey: jest.fn(),
  getPartyById: jest.fn(),
  getLedgerEnd: jest.fn(),
  getOperations: jest.fn(),
  getPendingTransferProposals: jest.fn(),
  getCalTokensCached: jest.fn(),
  getEnabledInstrumentsCached: jest.fn(),
}));
jest.mock("../getBalance");
jest.mock("../../signer");
const mockFindTokenById = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: () => ({ findTokenById: mockFindTokenById }),
}));

const mockedGateway = jest.mocked(gateway);
const mockedBalance = jest.mocked(balance);

const config = createMockCoinConfigValue({ minReserve: 0 });
const context = createMockContext(config);
const currency = createMockCantonCurrency();

const TOKEN_ID = "canton_network/cip56/cbtc";
const TOKEN_INSTRUMENT = "cbtc-instrument";
const TOKEN_ADMIN = "cbtc-admin";
const cbtc = {
  type: "TokenCurrency",
  id: TOKEN_ID,
  contractAddress: TOKEN_ADMIN,
  parentCurrency: currency,
  tokenType: "cip56",
  name: "CBTC",
  ticker: "CBTC",
  units: [{ name: "CBTC", code: "CBTC", magnitude: 8 }],
} as unknown as TokenCurrency;

const holding = (instrumentId: string, adminId: string, value: bigint): balance.CantonBalance => ({
  value,
  locked: 0n,
  asset: { type: instrumentId },
  utxoCount: 1,
  instrumentId,
  adminId,
});
const amulet = (value: bigint) => holding("Amulet", "AmuletAdmin", value);
const cbtcHolding = (value: bigint) => holding(TOKEN_INSTRUMENT, TOKEN_ADMIN, value);

const operation = (instrumentId = "Amulet", instrumentAdmin = "AmuletAdmin") =>
  ({
    transaction_hash: "tx",
    uid: "uid",
    type: "Receive",
    status: "Success",
    fee: { value: "0" },
    transfers: [{ value: "10", details: { operationType: "transfer" } }],
    transaction_timestamp: new Date(0).toISOString(),
    senders: ["sender"],
    recipients: ["party"],
    block: { height: 1, hash: "block" },
    asset: { type: instrumentId === "Amulet" ? "native" : "token", instrumentId, instrumentAdmin },
  }) as unknown as gateway.OperationInfo;
const operationWithoutTransfers = { ...operation(), transfers: [] } as gateway.OperationInfo;

type Chain = {
  balances?: balance.CantonBalance[];
  proposals?: gateway.TransferProposal[];
  operations?: gateway.OperationInfo[];
  listed?: boolean;
  enabled?: boolean;
};

function chain({
  balances = [],
  proposals = [],
  operations = [],
  listed = true,
  enabled = true,
}: Chain) {
  mockedGateway.getPartyByPubKey.mockResolvedValue({ party_id: "party" } as never);
  mockedGateway.getLedgerEnd.mockResolvedValue(1);
  mockedBalance.getBalance.mockImplementation(async () => [...balances]);
  mockedGateway.getPendingTransferProposals.mockResolvedValue(proposals);
  mockedGateway.getOperations.mockResolvedValue({ next: 0, operations });
  mockedGateway.getCalTokensCached.mockResolvedValue(
    new Map(listed ? [[TOKEN_ID, TOKEN_INSTRUMENT]] : []),
  );
  mockFindTokenById.mockImplementation(async (id: string) => (id === TOKEN_ID ? cbtc : undefined));
  mockedGateway.getEnabledInstrumentsCached.mockResolvedValue(
    new Set(enabled ? [gateway.getKey(TOKEN_INSTRUMENT, TOKEN_ADMIN)] : []),
  );
}

async function usedBySync(): Promise<boolean> {
  jest.mocked(resolver).mockReturnValue(async () => ({ publicKey: "ab", address: "" }) as never);
  const shape = await makeGetAccountShape({} as never, context)(
    {
      address: "",
      currency,
      derivationMode: "",
      derivationPath: "44'/6767'/0'/0'/0'",
      deviceId: "device",
      index: 0,
    },
    { paginationConfig: {} },
  );
  return Boolean(shape.used);
}

describe("getAccountStatus", () => {
  beforeEach(() => jest.resetAllMocks());

  it("is not onboarded when the gateway has no party for the key", async () => {
    mockedGateway.getPartyByPubKey.mockResolvedValue({} as never);
    await expect(getAccountStatus(context, currency.id, "ab")).resolves.toEqual({
      used: false,
      isOnboarded: false,
    });
    expect(mockedGateway.getPartyByPubKey).toHaveBeenCalledWith(config, "ab");
    expect(mockedBalance.getBalance).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a party not found",
      new TopologyChangeError("Topology change detected. Re-onboarding required."),
    ],
    ["a 404", Object.assign(new Error("Not Found"), { name: "LedgerAPI4xx", status: 404 })],
  ])("is not onboarded when the gateway answers %s", async (_, error) => {
    mockedGateway.getPartyByPubKey.mockRejectedValue(error);
    await expect(getAccountStatus(context, currency.id, "ab")).resolves.toEqual({
      used: false,
      isOnboarded: false,
    });
  });

  it.each([
    ["a timeout", new Error("timeout of 30000ms exceeded")],
    ["a 5xx", Object.assign(new Error("Bad Gateway"), { name: "LedgerAPI5xx", status: 502 })],
  ])("fails on %s instead of calling the key not onboarded", async (_, error) => {
    mockedGateway.getPartyByPubKey.mockRejectedValue(error);
    await expect(getAccountStatus(context, currency.id, "ab")).rejects.toBe(error);
  });

  it("reads the first page of operations the sync reads", async () => {
    chain({});
    await getAccountStatus(context, currency.id, "ab");
    expect(mockedGateway.getOperations).toHaveBeenCalledWith(config, "party", {
      cursor: 0,
      limit: 100,
    });
  });

  it("rejects with the abort reason and stops reading once aborted", async () => {
    chain({});
    const controller = new AbortController();
    const reason = new Error("aborted");
    mockedGateway.getPendingTransferProposals.mockImplementation(async () => {
      controller.abort(reason);
      return [];
    });
    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab"),
    ).rejects.toBe(reason);
    expect(mockedGateway.getPendingTransferProposals).toHaveBeenCalled();
    expect(mockedGateway.getCalTokensCached).not.toHaveBeenCalled();
    expect(mockedGateway.getOperations).not.toHaveBeenCalled();
  });

  it("does not call the gateway when already aborted", async () => {
    chain({});
    const controller = new AbortController();
    controller.abort();
    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab"),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(mockedGateway.getPartyByPubKey).not.toHaveBeenCalled();
  });

  it.each<[string, Chain, boolean]>([
    ["nothing on the party", { balances: [amulet(0n)] }, false],
    ["a native balance", { balances: [amulet(1n)] }, true],
    ["a pending transfer proposal", { proposals: [createMockPendingTransferProposal()] }, true],
    ["a native operation", { operations: [operation()] }, true],
    [
      "only an operation the sync drops as invalid",
      { operations: [operationWithoutTransfers] },
      false,
    ],
    [
      "only a token operation with no token account",
      { operations: [operation(TOKEN_INSTRUMENT, TOKEN_ADMIN)] },
      false,
    ],
    ["an enabled listed token", { balances: [cbtcHolding(1n)] }, true],
    ["an enabled listed token at zero", { balances: [cbtcHolding(0n)] }, true],
    ["only a disabled token", { balances: [cbtcHolding(1n)], enabled: false }, false],
    [
      "only an unlisted token, read as the native balance",
      { balances: [cbtcHolding(1n)], listed: false },
      true,
    ],
  ])("with %s, is used as the sync decides", async (_, state, used) => {
    chain(state);
    await expect(getAccountStatus(context, currency.id, "ab")).resolves.toEqual({
      used,
      isOnboarded: true,
    });
    await expect(usedBySync()).resolves.toBe(used);
  });
});
