import { getBalance as getBalanceFromNetwork, isGatewayEnabled } from "../../network/gateway";
import {
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
} from "../../test/fixtures";
import { getBalance } from "../getBalance";

jest.mock("../../network/gateway", () => ({
  ...jest.requireActual("../../network/gateway"),
  getBalance: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedGetBalanceFromNetwork = jest.mocked(getBalanceFromNetwork);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);

const contextWithReserve = (minReserve: number) =>
  createMockContext({ ...createMockCoinConfigValue(), minReserve });

describe("getBalance", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("folds every native row, whatever its admin, into one native balance", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(3, [
        { instrument_id: "Amulet", admin_id: "DSO", amount: "1000", locked: false },
        { instrument_id: "Amulet", admin_id: "DSO", amount: "300", locked: true },
        { instrument_id: "Amulet", admin_id: "OtherAdmin", amount: "200", locked: false },
      ]),
    );

    const balances = await getBalance(contextWithReserve(0), "party");

    expect(balances).toEqual([{ asset: { type: "native" }, value: 1500n, locked: 300n }]);
  });

  it("locks the reserve once on top of the locked native rows", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(3, [
        { instrument_id: "Amulet", admin_id: "DSO", amount: "1000", locked: false },
        { instrument_id: "Amulet", admin_id: "OtherAdmin", amount: "500", locked: false },
        { instrument_id: "Amulet", admin_id: "DSO", amount: "300", locked: true },
      ]),
    );

    const [native] = await getBalance(contextWithReserve(100), "party");

    expect(native).toEqual({ asset: { type: "native" }, value: 1800n, locked: 400n });
  });

  it("caps the reserve at the unlocked native amount", async () => {
    mockedGetBalanceFromNetwork.mockResolvedValue(
      createMockInstrumentBalances(2, [
        { instrument_id: "Amulet", amount: "40", locked: false },
        { instrument_id: "Amulet", amount: "300", locked: true },
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
