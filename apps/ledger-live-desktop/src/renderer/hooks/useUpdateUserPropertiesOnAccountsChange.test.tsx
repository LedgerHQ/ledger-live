import { describe, expect, test, jest, beforeAll } from "@jest/globals";
import { renderHook } from "@testing-library/react-hooks";
import * as redux from "react-redux";
import useUpdateUserPropertiesOnAccountsChange, {
  hasAccountsWithFundsChanged
} from "./useUpdateUserPropertiesOnAccountsChange";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { updateIdentify } from "../analytics/segment";

const eth = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");

const ethMockAccount: Account = {
  type: "Account",
  id: "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
  starred: false,
  used: true,
  seedIdentifier:
    "0441996d9ce858d8fd6304dd790e645500fc6cee7ae0fccfee8c8fa884dfa8ccf1f6f8cc82cc0aa71fc659c895a8a43b69f918b08a22b3a6145a0bbd93c5cb9308",
  derivationMode: "",
  index: 0,
  freshAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [
    {
      address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      derivationPath: "44'/60'/0'/0/0",
    },
  ],
  name: "Ethereum 1",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  unit: {
    name: "ether",
    code: "ETH",
    magnitude: 18,
  },
  currency: eth,
  lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 1676329200000 },
    DAY: { balances: [], latestDate: 1676329200000 },
    WEEK: { balances: [], latestDate: 1676329200000 },
  },
  nfts: [],
  subAccounts: [],
};
const polygonMockAccount: Account = {
  type: "Account",
  id: "js:2:polygon:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:",
  starred: false,
  used: true,
  seedIdentifier:
    "0441996d9ce858d8fd6304dd790e645500fc6cee7ae0fccfee8c8fa884dfa8ccf1f6f8cc82cc0aa71fc659c895a8a43b69f918b08a22b3a6145a0bbd93c5cb9308",
  derivationMode: "",
  index: 0,
  freshAddress: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
  freshAddressPath: "44'/60'/0'/0/0",
  freshAddresses: [
    {
      address: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      derivationPath: "44'/60'/0'/0/0",
    },
  ],
  name: "Polygon 1",
  blockHeight: 16626551,
  creationDate: new Date("2021-03-23T14:17:07.001Z"),
  balance: new BigNumber("22913015427119498"),
  spendableBalance: new BigNumber("22913015427119498"),
  operations: [],
  operationsCount: 0,
  pendingOperations: [],
  unit: {
    name: "matic",
    code: "MATIC",
    magnitude: 18,
  },
  currency: polygon,
  lastSyncDate: new Date("2023-02-14T11:01:19.252Z"),
  swapHistory: [],
  syncHash: "[]_6595",
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 1676329200000 },
    DAY: { balances: [], latestDate: 1676329200000 },
    WEEK: { balances: [], latestDate: 1676329200000 },
  },
  nfts: [],
  subAccounts: [],
};

describe("useUpdateUserPropertiesOnAccountsChange", () => {
  describe("falsy test", () => {
    // prepare mocking useSelector
    const spy = jest.spyOn(redux, "useSelector");
    jest.mock('updateIdentify')

    const setAccounts_Mock = (accounts: Account[]) => {
      spy.mockReturnValue(accounts);
    };

    test("should format date properly", () => {
      // Set empty accounts
      setAccounts_Mock([]);

      // Watch for changes in accounts
      renderHook(() => useUpdateUserPropertiesOnAccountsChange());

      expect(updateIdentify).not.toHaveBeenCalled();

      // Set new accounts
      setAccounts_Mock([ethMockAccount, polygonMockAccount]);

      expect(updateIdentify).not.toHaveBeenCalled();

      // Wait for 3 seconds (time of the debounce)
      jest.useFakeTimers();
      jest.runAllTimers();
      expect(updateIdentify).toHaveBeenCalledTimes(1);

      // // Change the balance of one of the accounts

      // expect(updateIdentify).toHaveBeenCalledTimes(1);

      // // Wait for 3 seconds (time of the debounce)

      // expect(updateIdentify).toHaveBeenCalledTimes(2);
    });
  });
});
