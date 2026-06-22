import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/devices";
import { server } from "tests/server";
import UndelegateFlowModal from "../index";
import * as useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import ContextMenu from "../../Delegation/ContextMenu";
import ModalsLayer from "~/renderer/ModalsLayer";
import { CardanoAccount, Transaction } from "@ledgerhq/live-common/families/cardano/types";
import { getCardanoAccountFixture } from "@ledgerhq/coin-cardano/fixtures/accounts";
import { getProtocolParamsFixture } from "@ledgerhq/coin-cardano/fixtures/protocolParams";
import { http, HttpResponse } from "msw";

jest.mock("~/renderer/actions/modals", () => {
  const original = jest.requireActual("~/renderer/actions/modals");
  return {
    ...original,
    openModal: jest.fn(original.openModal),
  };
});

import { openModal } from "~/renderer/actions/modals";

const mockTransaction: Transaction = {
  family: "cardano",
  mode: "undelegate",
  amount: new BigNumber(0),
  recipient: "",
  poolId: undefined,
};

const getMockAccountData = (
  overrides: { rewards?: BigNumber; dRepHex?: string } = {},
): CardanoAccount => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const account = getCardanoAccountFixture({
    delegation: undefined,
  });
  account.id = "mock:1:cardano:true_cardano_0:";
  account.freshAddress = "addr1_delegated";

  const rewards = overrides.rewards ?? new BigNumber("5000000");
  const dRepHex = overrides.dRepHex;

  account.cardanoResources.protocolParams = getProtocolParamsFixture();
  account.cardanoResources.delegation = {
    rewards,
    status: true,
    poolId: "pool1_ledger",
    ticker: "LEDGER",
    name: "Ledger",
    dRepHex,
    deposit: "2000000",
  };

  return account;
};

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => {
    const account = getMockAccountData();
    return {
      transaction: mockTransaction,
      setTransaction: jest.fn(),
      updateTransaction: jest.fn(),
      updateAccount: jest.fn(),
      account,
      parentAccount: null,
      setAccount: jest.fn(),
      status: {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("200000"),
        amount: new BigNumber("0"),
        totalSpent: new BigNumber("200000"),
      },
      bridgeError: null,
      bridgePending: false,
    };
  },
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => {
    const bridge = {
      createTransaction: jest.fn(() => mockTransaction),
      updateTransaction: jest.fn((t, patch) => ({ ...t, ...patch })),
      prepareTransaction: jest.fn(t => Promise.resolve(t)),
      getTransactionStatus: jest.fn(() =>
        Promise.resolve({
          errors: {},
          warnings: {},
          estimatedFees: new BigNumber("200000"),
          amount: new BigNumber("0"),
          totalSpent: new BigNumber("200000"),
        }),
      ),
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled", value: bridge });
  }),
}));

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: jest.fn(() => ({})),
  importLLDCoinFamily: jest.fn(() => Promise.resolve({})),
}));

// Render coin modals synchronously here: this test exercises the openModal → ModalsLayer flow, not
// the lazy chunk loading (covered by families/__tests__/loaders.test.ts), which never settles in jest.
jest.mock("~/renderer/families/modals-loaders", () => ({
  __esModule: true,
  coinModalLoaders: {
    MODAL_CARDANO_UNDELEGATE: jest.requireActual("../index").default,
    MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO: jest.requireActual("../info").default,
  },
  coinModalImports: {},
  preloadCoinModals: jest.fn(),
}));

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer">Mock Account Footer</div>,
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action">Mock Device Action</div>,
}));

jest.mock("~/renderer/modals/Send", () => ({
  __esModule: true,
  default: () => <div data-testid="modal-send">Mock Send Modal</div>,
}));

jest.mock("~/renderer/components/DropDownSelector", () => {
  const MockDropDown = ({
    children,
    items,
    renderItem,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: (props: Record<string, any>) => React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Array<Record<string, any> & { key?: string | number }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderItem: (props: { item: Record<string, any> }) => React.ReactNode;
  }) => {
    return (
      <div>
        {children && children({})}
        <div data-testid="dropdown-items">
          {items.map((item, index) => (
            <div key={item.key || index}>
              {renderItem ? renderItem({ item }) : <div onClick={item.onClick}>{item.label}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };
  const MockDropDownItem = ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <div onClick={onClick} data-testid="dropdown-item">
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: MockDropDown,
    DropDownItem: MockDropDownItem,
  };
});

const setup = (overrides: { rewards?: BigNumber; dRepHex?: string } = {}) => {
  const mockAccountData = getMockAccountData(overrides);
  const initialState = {
    devices: {
      currentDevice: {
        deviceId: "test",
        modelId: DeviceModelId.nanoS,
        wired: true,
      },
    },
    accounts: {
      active: [mockAccountData],
    },
  };
  return { mockAccountData, initialState };
};

const FullFlowWrapper = ({ account }: { account: CardanoAccount }) => (
  <>
    <ContextMenu account={account} />
    <ModalsLayer />
  </>
);

describe("Cardano Undelegate Flow Integration", () => {
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
    jest.clearAllMocks();
    server.use(...handlers);

    if (!document.getElementById("modals")) {
      const modalsRoot = document.createElement("div");
      modalsRoot.id = "modals";
      document.body.appendChild(modalsRoot);
    }
  });

  afterEach(() => {
    cleanup();
    document.getElementById("modals")?.remove();
  });

  describe("when user has no rewards", () => {
    it("should navigate from Context Menu to completion", async () => {
      const { mockAccountData, initialState } = setup({
        rewards: new BigNumber(0),
        dRepHex: undefined,
      });

      const { user } = render(<FullFlowWrapper account={mockAccountData} />, {
        initialState,
      });

      const contextMenuButton = screen.getByTestId("delegation-context-menu-button");
      expect(contextMenuButton).toBeInTheDocument();
      await user.click(screen.getByTestId("delegation-undelegate-button"));

      expect(await screen.findByTestId("modal-cardano-undelegate")).toBeInTheDocument();

      const continueButton = document.getElementById("undelegate-continue-button");
      expect(continueButton).not.toBeNull();
      await user.click(continueButton!);

      const deviceAction = await screen.findByTestId("device-action");
      expect(deviceAction).toBeInTheDocument();
    });
  });

  describe("when user has rewards but no DRep delegated", () => {
    it("should navigate from Context Menu to Info Modal to Send Modal", async () => {
      const { mockAccountData, initialState } = setup({
        rewards: new BigNumber("5000000"),
        dRepHex: undefined,
      });

      const { user } = render(<FullFlowWrapper account={mockAccountData} />, {
        initialState,
      });

      await user.click(screen.getByTestId("delegation-undelegate-button"));

      expect(
        await screen.findByTestId("modal-cardano-undelegate-self-tx-info"),
      ).toBeInTheDocument();

      const modalContinueButton = await screen.findByTestId("modal-continue-button");
      await user.click(modalContinueButton);

      expect(openModal).toHaveBeenCalledWith("MODAL_SEND", expect.anything());
    });
  });

  describe("when bridge network error occurs", () => {
    it("should display a bridge error if transaction preparation fails", async () => {
      const spy = jest.spyOn(useBridgeTransaction, "default").mockReturnValue({
        transaction: mockTransaction,
        setTransaction: jest.fn(),
        updateTransaction: jest.fn(),
        updateAccount: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        account: getMockAccountData({ dRepHex: "dRepHex1" }) as CardanoAccount,
        parentAccount: null,
        setAccount: jest.fn(),
        status: {
          errors: {},
          warnings: {},
          estimatedFees: new BigNumber("0"),
          amount: new BigNumber("0"),
          totalSpent: new BigNumber("0"),
        },
        bridgeError: new Error("Bridge network error"),
        bridgePending: false,
      });

      try {
        const { mockAccountData, initialState } = setup();
        render(<UndelegateFlowModal account={mockAccountData} />, {
          initialState: {
            ...initialState,
            modals: {
              MODAL_CARDANO_UNDELEGATE: { isOpened: true, data: { account: mockAccountData } },
            },
          },
        });

        expect(await screen.findByText(/Bridge network error/i)).toBeInTheDocument();
      } finally {
        spy.mockRestore();
      }
    });
  });
});
