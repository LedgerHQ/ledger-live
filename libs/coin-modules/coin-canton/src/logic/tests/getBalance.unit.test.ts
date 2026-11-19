import {
  getBalance as getBalanceFromNetwork,
  getNativeInstrument,
  isGatewayEnabled,
} from "../../network/gateway";
import {
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
} from "../../test/fixtures";
import { getBalance } from "../getBalance";

jest.mock("../../network/gateway", () => ({
  ...jest.requireActual("../../network/gateway"),
  getBalance: jest.fn(),
  getNativeInstrument: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedGetBalanceFromNetwork = jest.mocked(getBalanceFromNetwork);
const mockedGetNativeInstrument = jest.mocked(getNativeInstrument);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);

const DSO = "DSO";

const contextWithReserve = (minReserve: number) =>
  createMockContext({ ...createMockCoinConfigValue(), minReserve });

describe("getBalance", () => {
  beforeEach(() => {
    mockedGetNativeInstrument.mockResolvedValue({ instrumentId: "Amulet", instrumentAdmin: DSO });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("folds the DSO's native rows into one native balance and keeps another admin's as a token", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(3, [
        { instrument_id: "Amulet", admin_id: DSO, amount: "1000", locked: false },
        { instrument_id: "Amulet", admin_id: DSO, amount: "300", locked: true },
        { instrument_id: "Amulet", admin_id: "OtherAdmin", amount: "200", locked: false },
      ]),
    );

    const balances = await getBalance(contextWithReserve(0), "party");

    expect(balances).toEqual([
      { asset: { type: "native" }, value: 1300n, locked: 300n },
      {
        asset: { type: "token", assetReference: "Amulet", assetOwner: "OtherAdmin" },
        value: 200n,
        locked: 0n,
      },
    ]);
  });

  it("locks the reserve once on top of the locked native rows", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(3, [
        { instrument_id: "Amulet", admin_id: DSO, amount: "1000", locked: false },
        { instrument_id: "Amulet", admin_id: "OtherAdmin", amount: "500", locked: false },
        { instrument_id: "Amulet", admin_id: DSO, amount: "300", locked: true },
      ]),
    );

    const [native] = await getBalance(contextWithReserve(100), "party");

    expect(native).toEqual({ asset: { type: "native" }, value: 1300n, locked: 400n });
  });

  it("fails when the DSO party can't be read, rather than guessing which rows are native", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(createMockInstrumentBalances(1));
    mockedGetNativeInstrument.mockRejectedValue(new Error("gateway down"));

    await expect(getBalance(contextWithReserve(0), "party")).rejects.toThrow("gateway down");
  });

  it("locks exactly 1 CC for a reserve configured as 1e38", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(1, [
        {
          instrument_id: "Amulet",
          admin_id: DSO,
          amount: (2n * 10n ** 38n).toString(),
          locked: false,
        },
      ]),
    );

    const [native] = await getBalance(contextWithReserve(1e38), "party");

    expect(native).toEqual({
      asset: { type: "native" },
      value: 2n * 10n ** 38n,
      locked: 10n ** 38n,
    });
  });

  it("caps the reserve at the unlocked native amount", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(2, [
        { instrument_id: "Amulet", admin_id: DSO, amount: "40", locked: false },
        { instrument_id: "Amulet", admin_id: DSO, amount: "300", locked: true },
      ]),
    );

    const [native] = await getBalance(contextWithReserve(100), "party");

    expect(native).toEqual({ asset: { type: "native" }, value: 340n, locked: 340n });
  });

  it("keys tokens by instrument id and admin, merging their locked and unlocked rows", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(3, [
        { instrument_id: "USDCx", admin_id: "IssuerA", amount: "700", locked: false },
        { instrument_id: "USDCx", admin_id: "IssuerA", amount: "50", locked: true },
        { instrument_id: "USDCx", admin_id: "IssuerB", amount: "9", locked: false },
      ]),
    );

    const balances = await getBalance(contextWithReserve(100), "party");

    expect(balances).toEqual([
      {
        asset: { type: "token", assetReference: "USDCx", assetOwner: "IssuerA" },
        value: 750n,
        locked: 50n,
      },
      {
        asset: { type: "token", assetReference: "USDCx", assetOwner: "IssuerB" },
        value: 9n,
        locked: 0n,
      },
    ]);
  });

  it("returns no balance for a party holding nothing", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue([]);

    await expect(getBalance(createMockContext(), "party")).resolves.toEqual([]);
  });

  it("queries the gateway with the resolved config and party", async () => {
    const config = createMockCoinConfigValue();
    mockedGetBalanceFromNetwork.mockResolvedValue([]);

    await getBalance(createMockContext(config), "party");

    expect(mockedGetBalanceFromNetwork).toHaveBeenCalledWith(config, "party");
  });

  it("throws when the gateway is disabled, the only implemented transport", async () => {
    mockedIsGatewayEnabled.mockReturnValueOnce(false);

    await expect(getBalance(createMockContext(), "party")).rejects.toThrow("Not implemented");
    expect(mockedGetBalanceFromNetwork).not.toHaveBeenCalled();
  });
});
