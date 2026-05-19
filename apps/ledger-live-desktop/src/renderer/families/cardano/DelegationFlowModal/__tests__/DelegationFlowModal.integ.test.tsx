import React from "react";
import { render, screen, waitFor, cleanup } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { DeviceModelId } from "@ledgerhq/devices";
import { server } from "tests/server";
import DelegationFlowModal from "../index";
import { http, HttpResponse } from "msw";
import { getCardanoAccountFixture } from "@ledgerhq/coin-cardano/fixtures/accounts";

setSupportedCurrencies(["cardano"]);

const mockPools = [
  {
    poolId: "a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6",
    name: "Ledger by Figment 1",
    ticker: "LBF1",
    website: "https://www.ledger.com/coin/staking/cardano",
    cost: "170.0",
    margin: "6",
    pledge: "9.82",
    liveStake: "40.22",
    retiredEpoch: 618,
  },
  {
    poolId: "4a9c9902c9538da900b10b716d5d1b214487455fdb06028b32ffa180",
    name: "Ledger by Figment 2",
    ticker: "LBF2",
    website: "https://www.ledger.com/coin/staking/cardano",
    cost: "170.0",
    margin: "6",
    pledge: "9.82",
    liveStake: "91.69",
    retiredEpoch: 618,
  },
];

// Mock data generator for the account
const getMockAccountData = getCardanoAccountFixture({ delegation: undefined });

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => {
    const account = getMockAccountData;
    return {
      transaction: {
        mode: "delegate",
        poolId: "00000000000000000000000000000000000000000000000000000001",
        protocolParams: account.cardanoResources.protocolParams,
      },
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      account,
      status: {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("200000"),
        amount: new BigNumber("0"),
      },
      bridgeError: null,
      bridgePending: false,
    };
  },
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => ({
    createTransaction: jest.fn(() => ({ mode: "delegate", poolId: null })),
    updateTransaction: jest.fn((t, patch) => ({ ...t, ...patch })),
    prepareTransaction: jest.fn(t => Promise.resolve(t)),
    getTransactionStatus: jest.fn(() =>
      Promise.resolve({
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("200000"),
      }),
    ),
  })),
}));

// We still mock useCardanoFamilyPools for now to avoid complexity of live-common registration in JSDOM,
// but we use the data from our MSW-matched mockPools.
jest.mock("@ledgerhq/live-common/families/cardano/react", () => ({
  useCardanoFamilyPools: jest.fn(() => ({
    pools: mockPools,
    searchQuery: "",
    setSearchQuery: jest.fn(),
    onScrollEndReached: jest.fn(),
    isSearching: false,
    isPaginating: false,
  })),
}));

jest.mock("~/renderer/families", () => ({
  getLLDCoinFamily: jest.fn(() => ({})),
}));

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer">Mock Account Footer</div>,
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action">Mock Device Action</div>,
}));

jest.mock("../ScrollLoadingList", () => ({
  __esModule: true,
  default: ({ data, renderItem }: any) => {
    return (
      <div data-testid="scroll-loading-list">
        {data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => item != null)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any, index: number) => renderItem(item, index))}
      </div>
    );
  },
}));

jest.mock("@ledgerhq/live-common/families/cardano/staking", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/cardano/staking"),
  fetchPoolDetails: jest.fn(() =>
    Promise.resolve({
      pools: mockPools,
    }),
  ),
  fetchAndSortPools: jest.fn(() => Promise.resolve(mockPools)),
}));

describe("Cardano DelegationFlowModal Integration", () => {
  const handlers = [
    http.get("*/v1/pool/list", () => {
      return HttpResponse.json({
        pageNo: 1,
        limit: 10,
        count: mockPools.length,
        pools: mockPools,
      });
    }),
    http.get("*/v1/pool/detail", () => {
      return HttpResponse.json({
        pools: [mockPools[0]],
      });
    }),
  ];

  beforeEach(() => {
    server.use(...handlers);

    if (!document.getElementById("modals")) {
      const modalsRoot = document.createElement("div");
      modalsRoot.id = "modals";
      document.body.appendChild(modalsRoot);
    }
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    document.getElementById("modals")?.remove();
  });

  it("should navigate through the delegation flow", async () => {
    const mockAccountData = getMockAccountData;
    const initialState = {
      devices: {
        currentDevice: {
          deviceId: "test",
          modelId: DeviceModelId.nanoS,
          wired: true,
        },
      },
      modals: {
        MODAL_CARDANO_DELEGATE: { isOpened: true, data: { account: mockAccountData } },
      },
    };

    const { user } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <DelegationFlowModal account={mockAccountData as any} />,
      { initialState },
    );

    // Step 1: Validator Selection
    await waitFor(() => {
      expect(
        screen.getByTestId(
          "validator-row-a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6",
        ),
      ).toBeInTheDocument();
    });

    const ledgerPool = screen.getByTestId(
      "validator-row-a314a18528d00c5fbd067ecb4a212cf2f307c83d2c08f44a11ebebf6",
    );
    await user.click(ledgerPool);

    const continueButton = document.getElementById("delegate-continue-button");
    expect(continueButton).not.toBeDisabled();
    await user.click(continueButton!);

    // Step 2: Summary
    await waitFor(() => {
      expect(screen.getByText(/delegating to/i)).toBeInTheDocument();
    });
    // Validator name should be present in summary
    expect(screen.getByTestId("validator-name-label")).toHaveTextContent(/Ledger by Figment 1/i);

    const summaryContinueButton = document.getElementById("delegate-continue-button");
    await user.click(summaryContinueButton!);

    // Step 3: Connect Device (Generic)
    await waitFor(() => {
      expect(screen.getByTestId("device-action")).toBeInTheDocument();
    });
  });

  it("should display a bridge error if transaction preparation fails", async () => {
    jest
      .spyOn(require("@ledgerhq/live-common/bridge/useBridgeTransaction"), "default")
      .mockReturnValue({
        transaction: {
          mode: "delegate",
          poolId: "00000000000000000000000000000000000000000000000000000001",
          protocolParams: getMockAccountData.cardanoResources.protocolParams,
        },
        setTransaction: jest.fn(),
        updateTransaction: jest.fn(),
        account: getMockAccountData,
        status: {
          errors: {},
          warnings: {},
          estimatedFees: new BigNumber("200000"),
          amount: new BigNumber("0"),
        },
        bridgeError: new Error("Network connection failed"),
        bridgePending: false,
      });

    const mockAccountData = getMockAccountData;
    const initialState = {
      devices: {
        currentDevice: {
          deviceId: "test",
          modelId: DeviceModelId.nanoS,
          wired: true,
        },
      },
      modals: {
        MODAL_CARDANO_DELEGATE: { isOpened: true, data: { account: mockAccountData } },
      },
    };

    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <DelegationFlowModal account={mockAccountData as any} />,
      { initialState },
    );

    expect(await screen.findByText(/Network connection failed/i)).toBeInTheDocument();
  });
});
