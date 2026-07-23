import { renderHook } from "tests/testSetup";
import { useTrackFundsReceived } from "../useTrackFundsReceived";
import { track } from "~/renderer/analytics/segment";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

const eth = getCryptoCurrencyById("ethereum");
const ethAccountId = "js:2:ethereum:0xabc:";

const createReceiveOperation = (hash: string): Operation => ({
  id: encodeOperationId(ethAccountId, hash, "IN"),
  hash,
  type: "IN",
  value: new BigNumber(1),
  fee: new BigNumber(0),
  senders: ["0xsender"],
  recipients: ["0xrecipient"],
  accountId: ethAccountId,
  date: new Date("2024-01-01T00:00:00.000Z"),
  blockHeight: 1,
  blockHash: null,
  transactionSequenceNumber: new BigNumber(1),
  hasFailed: false,
  extra: {},
});

const createEthAccount = (operations: Operation[]): Account => ({
  type: "Account",
  id: ethAccountId,
  used: true,
  seedIdentifier: "seed",
  derivationMode: "",
  index: 0,
  freshAddress: "0xabc",
  freshAddressPath: "44'/60'/0'/0/0",
  blockHeight: 1,
  creationDate: new Date("2024-01-01T00:00:00.000Z"),
  balance: new BigNumber(1),
  spendableBalance: new BigNumber(1),
  operations,
  operationsCount: operations.length,
  pendingOperations: [],
  currency: eth,
  lastSyncDate: new Date("2024-01-01T00:00:00.000Z"),
  swapHistory: [],
  balanceHistoryCache: {
    HOUR: { balances: [], latestDate: 0 },
    DAY: { balances: [], latestDate: 0 },
    WEEK: { balances: [], latestDate: 0 },
  },
  subAccounts: [],
});

const trackingEnabledState = {
  settings: {
    ...AFTER_ONBOARDING_STATE,
    shareAnalytics: true,
  },
};

const trackingDisabledState = {
  settings: {
    ...AFTER_ONBOARDING_STATE,
    shareAnalytics: false,
    sharePersonalizedRecommandations: false,
  },
};

describe("useTrackFundsReceived", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does not track existing receive operations on initial mount", () => {
    renderHook(() => useTrackFundsReceived(), {
      initialState: {
        accounts: [createEthAccount([createReceiveOperation("initial-receive")])],
        ...trackingEnabledState,
      },
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("tracks newly received operations with asset and network", () => {
    const initialAccount = createEthAccount([createReceiveOperation("initial-receive")]);

    const { rerender, store } = renderHook(() => useTrackFundsReceived(), {
      initialState: {
        accounts: [initialAccount],
        ...trackingEnabledState,
      },
    });

    store.dispatch(
      replaceAccounts([
        createEthAccount([
          createReceiveOperation("initial-receive"),
          createReceiveOperation("new-receive"),
        ]),
      ]),
    );
    rerender();

    expect(track).toHaveBeenCalledWith(
      "Funds received",
      {
        asset: "Ethereum",
        network: "Ethereum",
      },
      true,
    );
  });

  it("respects tracking consent", () => {
    const { rerender, store } = renderHook(() => useTrackFundsReceived(), {
      initialState: {
        accounts: [createEthAccount([])],
        ...trackingDisabledState,
      },
    });

    store.dispatch(replaceAccounts([createEthAccount([createReceiveOperation("new-receive")])]));
    rerender();

    expect(track).toHaveBeenCalledWith(
      "Funds received",
      {
        asset: "Ethereum",
        network: "Ethereum",
      },
      false,
    );
  });
});
