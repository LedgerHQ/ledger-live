import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { getAccountShape } from "./synchronisation";

const mockGetAccountInfo = jest.fn();
jest.mock("./network/Cosmos", () => {
  return {
    CosmosAPI: jest.fn().mockImplementation(() => {
      return {
        getAccountInfo: () => mockGetAccountInfo(),
      };
    }),
  };
});

const baseAccountInfoMock = {
  txs: [],
  delegations: [],
  unbondings: [],
  balances: new BigNumber(0),
  accountInfo: { sequence: 0n, accountNumber: 0 },
};

describe("scanAccounts", () => {
  beforeEach(() => {
    mockGetAccountInfo.mockClear();
  });

  it.each([
    {
      balances: new BigNumber(100),
      accountInfo: { sequence: 0n, accountNumber: 0 },
    },
    {
      balances: new BigNumber(0),
      accountInfo: { sequence: 1n, accountNumber: 0 },
    },
  ])("returns an account flagged as used", async ({ balances, accountInfo }) => {
    // Given
    const currency = getCryptoCurrencyById("cosmos");
    const address = "";
    const addressResolver = {
      address,
      path: "path",
      publicKey: "publicKey",
    };
    mockGetAccountInfo.mockResolvedValue({ ...baseAccountInfoMock, balances, accountInfo });

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });
    const { account } = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "",
        syncConfig: {} as SyncConfig,
      }),
    );

    // Then
    expect(account.used).toBe(true);
  });
});
