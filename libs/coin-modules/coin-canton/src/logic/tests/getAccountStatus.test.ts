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
import * as balance from "../instrumentBalances";
import { getAccountStatus } from "../getAccountStatus";
import { TopologyChangeError } from "../../types/errors";
import type { Party } from "../../types/gateway";

jest.mock("../../network/gateway", () => ({
  ...jest.requireActual("../../network/gateway"),
  getPartyByPubKey: jest.fn(),
  getPartyById: jest.fn(),
  getLedgerEnd: jest.fn(),
  getNativeInstrument: jest.fn(),
  getOperations: jest.fn(),
  getPendingTransferProposals: jest.fn(),
  getCalTokensCached: jest.fn(),
  getEnabledInstrumentsCached: jest.fn(),
  getEnabledInstrumentsStrictCached: jest.fn(),
}));
jest.mock("../instrumentBalances");
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
  isLocked: false,
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
const tokenSendPayingCc = {
  ...operation(TOKEN_INSTRUMENT, TOKEN_ADMIN),
  type: "Send",
  senders: ["party"],
  fee: {
    value: "1",
    asset: { type: "native", instrumentId: "Amulet", instrumentAdmin: "AmuletAdmin" },
  },
} as unknown as gateway.OperationInfo;
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
  mockedGateway.getNativeInstrument.mockResolvedValue({
    instrumentId: "Amulet",
    instrumentAdmin: "AmuletAdmin",
  });
  mockedBalance.getInstrumentBalances.mockImplementation(async () => [...balances]);
  mockedGateway.getPendingTransferProposals.mockResolvedValue(proposals);
  mockedGateway.getOperations.mockResolvedValue({ next: -1, operations });
  mockedGateway.getCalTokensCached.mockResolvedValue(
    new Map(listed ? [[TOKEN_ID, TOKEN_INSTRUMENT]] : []),
  );
  mockFindTokenById.mockImplementation(async (id: string) => (id === TOKEN_ID ? cbtc : undefined));
  mockedGateway.getEnabledInstrumentsCached.mockResolvedValue(
    new Set(enabled ? [gateway.getKey(TOKEN_INSTRUMENT, TOKEN_ADMIN)] : []),
  );
  mockedGateway.getEnabledInstrumentsStrictCached.mockResolvedValue(
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
    expect(mockedBalance.getInstrumentBalances).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a party not found",
      new TopologyChangeError("Topology change detected. Re-onboarding required."),
    ],
    ["a 404", Object.assign(new Error("Not Found"), { name: "LedgerAPI4xx", status: 404 })],
    [
      "its 400 for an unknown public key",
      Object.assign(new Error('Party with public key "ab" does not exist'), {
        name: "LedgerAPI4xx",
        status: 400,
      }),
    ],
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

  it("reads the operations from the first ledger offset", async () => {
    chain({});
    await getAccountStatus(context, currency.id, "ab");
    expect(mockedGateway.getOperations).toHaveBeenCalledWith(config, "party", {
      minOffset: 0,
      cursor: undefined,
      limit: 1000,
    });
  });

  it("reads the next pages until it finds a native operation", async () => {
    chain({});
    mockedGateway.getOperations
      .mockResolvedValueOnce({ next: 3, operations: [operation(TOKEN_INSTRUMENT, TOKEN_ADMIN)] })
      .mockResolvedValueOnce({ next: 6, operations: [operation()] });
    await expect(getAccountStatus(context, currency.id, "ab")).resolves.toEqual({
      used: true,
      isOnboarded: true,
    });
    expect(mockedGateway.getOperations).toHaveBeenCalledTimes(2);
    expect(mockedGateway.getOperations).toHaveBeenLastCalledWith(config, "party", {
      minOffset: 0,
      cursor: 2,
      limit: 1000,
    });
  });

  it("stops paging the operations once aborted", async () => {
    chain({});
    const controller = new AbortController();
    const reason = new Error("aborted");
    mockedGateway.getOperations.mockImplementation(async () => {
      controller.abort(reason);
      return { next: 3, operations: [operation(TOKEN_INSTRUMENT, TOKEN_ADMIN)] };
    });
    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab"),
    ).rejects.toBe(reason);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedGateway.getOperations).toHaveBeenCalledTimes(1);
  });

  it("does not page the operations once another holding makes the party used", async () => {
    chain({ balances: [amulet(1n)] });
    await getAccountStatus(context, currency.id, "ab");
    expect(mockedGateway.getOperations).not.toHaveBeenCalled();
  });

  it("rejects on abort before the request in flight answers, and starts no read after it", async () => {
    chain({});
    let answer: (party: Party) => void = () => {};
    mockedGateway.getPartyByPubKey.mockReturnValue(new Promise(resolve => (answer = resolve)));
    const controller = new AbortController();
    const reason = new Error("aborted");
    const status = getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedGateway.getPartyByPubKey).toHaveBeenCalled();
    controller.abort(reason);
    await expect(status).rejects.toBe(reason);
    answer({ party_id: "party", public_key: "ab" });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedGateway.getNativeInstrument).not.toHaveBeenCalled();
  });

  it("reads a funded party as used without the instruments, even when they are down", async () => {
    chain({ balances: [amulet(1n), cbtcHolding(1n)] });
    mockedGateway.getEnabledInstrumentsStrictCached.mockRejectedValue(new Error("down"));
    await expect(getAccountStatus(context, currency.id, "ab")).resolves.toEqual({
      used: true,
      isOnboarded: true,
    });
    expect(mockedGateway.getEnabledInstrumentsStrictCached).not.toHaveBeenCalled();
  });

  it("fails instead of reading an instruments outage as no token enabled", async () => {
    chain({ balances: [cbtcHolding(1n)] });
    const outage = new Error("instruments unavailable");
    mockedGateway.getEnabledInstrumentsStrictCached.mockRejectedValue(outage);
    await expect(getAccountStatus(context, currency.id, "ab")).rejects.toBe(outage);
  });

  it("starts no request once aborted while the config loads", async () => {
    chain({});
    let loaded: (value: typeof config) => void = () => {};
    const controller = new AbortController();
    const reason = new Error("aborted");
    const status = getAccountStatus(
      {
        ...context,
        config: () => new Promise(resolve => (loaded = resolve)),
        signal: controller.signal,
      },
      currency.id,
      "ab",
    );
    controller.abort(reason);
    await expect(status).rejects.toBe(reason);
    loaded(config);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedGateway.getPartyByPubKey).not.toHaveBeenCalled();
  });

  it("starts no read once aborted while a party read is in flight", async () => {
    chain({});
    let answer: (instrument: { instrumentId: string; instrumentAdmin: string }) => void = () => {};
    mockedGateway.getNativeInstrument.mockReturnValue(new Promise(resolve => (answer = resolve)));
    const controller = new AbortController();
    const reason = new Error("aborted");
    const status = getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedGateway.getNativeInstrument).toHaveBeenCalled();
    controller.abort(reason);
    await expect(status).rejects.toBe(reason);
    answer({ instrumentId: "Amulet", instrumentAdmin: "AmuletAdmin" });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockedBalance.getInstrumentBalances).not.toHaveBeenCalled();
  });

  it("stops the CAL lookups once aborted", async () => {
    chain({ balances: [cbtcHolding(1n)] });
    mockedGateway.getCalTokensCached.mockResolvedValue(
      new Map([
        [TOKEN_ID, TOKEN_INSTRUMENT],
        ["canton_network/cip56/other", TOKEN_INSTRUMENT],
      ]),
    );
    const controller = new AbortController();
    const reason = new Error("aborted");
    mockFindTokenById.mockImplementation(async () => {
      controller.abort(reason);
      return cbtc;
    });
    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, currency.id, "ab"),
    ).rejects.toBe(reason);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockFindTokenById).toHaveBeenCalledTimes(1);
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
    [
      "only a CC fee paid on a token transfer",
      { operations: [tokenSendPayingCc], enabled: false },
      true,
    ],
    ["an enabled listed token", { balances: [cbtcHolding(1n)] }, true],
    ["an enabled listed token at zero", { balances: [cbtcHolding(0n)] }, true],
    ["only a disabled token", { balances: [cbtcHolding(1n)], enabled: false }, false],
    [
      "only an unlisted token, not read as the native balance",
      { balances: [cbtcHolding(1n)], listed: false },
      false,
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
