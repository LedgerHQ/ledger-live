import React from "react";
import { Observable, Subject } from "rxjs";
import { setEnv } from "@ledgerhq/live-env";
import type { Account } from "@ledgerhq/types-live";
import { act } from "react-dom/test-utils";
import { render, screen, userEvent } from "tests/testSetup";
import { openModal } from "~/renderer/actions/modals";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { State } from "~/renderer/reducers";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import ModularDrawerAddAccountFlowManager from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import {
  ALEO_ACCOUNT_1,
  ALEO_ACCOUNT_2,
  ALEO_ACCOUNT_3,
  NEW_ALEO_ACCOUNT,
} from "../__mocks__/accounts.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";

beforeEach(async () => {
  mockDomMeasurements();
});

const mockAppState = {
  device: { modelId: "stax" },
  onResult: () => true,
  isLocked: false,
  opened: true,
};

let progress$: Subject<unknown>;
let triggerNext: (accounts: Account[]) => void = () => null;
let triggerComplete: () => void = () => null;
const mockNavigate = jest.fn();

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/actions/app"),
  createAction: () => ({
    useHook: () => mockAppState,
    mapResult: () => ({ device: { deviceId: 123456 } }),
  }),
}));

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  ...jest.requireActual("@ledgerhq/live-common/hw/deviceAccess"),
  // return the observable directly, bypassing transport creation
  withDevice: () => (job: () => Observable<unknown>) => job(),
}));

jest.mock("@ledgerhq/live-common/families/aleo/hw/getViewKey/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/hw/getViewKey/index"),
  getViewKeyExec: jest.fn(() => progress$.asObservable()),
}));

jest.mock("~/renderer/reducers/devices", () => {
  return {
    __esModule: true,
    ...jest.requireActual("~/renderer/reducers/devices"),
    getCurrentDevice: jest.fn(() => mockAppState.device),
  };
});

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/bridge/index"),
  getCurrencyBridge: () => ({
    scanAccounts: () => ({
      pipe: () => ({
        subscribe: ({
          next,
          complete,
        }: {
          next: (accounts: Account[]) => void;
          complete: () => void;
        }) => {
          triggerNext = accounts => next(accounts);
          triggerComplete = () => complete();
        },
      }),
    }),
    preload: () => true,
    hydrate: () => true,
  }),
}));

jest.mock("~/renderer/animations", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("react-router", () => ({
  __esModule: true,
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("~/renderer/actions/modals", () => ({
  ...jest.requireActual("~/renderer/actions/modals"),
  openModal: jest.fn().mockReturnValue({ type: "" }),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
}));

const mockScanAccountsSubscription = async (accounts: Account[]) => {
  await Promise.all(accounts.map((_, i) => act(() => triggerNext(accounts.slice(0, i + 1)))));
  await act(async () => triggerComplete());
};

const mockViewKeyProgressSubscription = async (
  progressSteps: {
    accountId: string;
    viewKey: string | null;
  }[],
) => {
  const total = progressSteps.length;
  const viewKeys: Record<string, string | null> = {};

  for (const [index, step] of progressSteps.entries()) {
    if (step.viewKey !== null) {
      viewKeys[step.accountId] = step.viewKey;
    }

    await act(async () => {
      progress$.next({
        viewKeys,
        completed: index + 1,
        total,
      });
    });
  }

  await act(async () => {
    progress$.complete();
  });
};

const setup = (state?: Partial<State>) => {
  const initialState = {
    ...state,
    modularDrawer: {
      source: "MADSource",
      flow: "Add account",
      ...state?.modularDrawer,
    },
  };

  return render(<ModularDrawerAddAccountFlowManager currency={aleoCurrency} />, { initialState });
};

function expectTrackPage(
  n: number,
  page: string,
  props: { flow?: string; reason?: string } = {},
  source = "MADSource",
) {
  expect(trackPage).toHaveBeenNthCalledWith(n, page, undefined, { ...props, source }, true, true);
}

describe("ModularDrawerAddAccountFlowManager", () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    jest.mocked(trackPage).mockReset();
    progress$ = new Subject();
    setEnv("EXPERIMENTAL_CURRENCIES", "aleo");
  });

  afterEach(() => {
    progress$.complete();
  });

  it("should render warning step", async () => {
    setup();

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Allow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    const learnMoreLink = screen.getByTestId("learn-more-link");
    await userEvent.click(learnMoreLink);

    expect(openURL).toHaveBeenCalledTimes(1);
  });

  it("should find and add Aleo accounts", async () => {
    setup();

    expectTrackPage(1, "device connection", { flow: "Add account" });

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    expectTrackPage(2, "confirm view key warning", { flow: "Add account" });
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    expectTrackPage(3, "looking for accounts", { flow: "Add account" });
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1, ALEO_ACCOUNT_2, ALEO_ACCOUNT_3]);

    expect(screen.getByText(/we found 3 accounts/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share view keys" }));

    expect(screen.getByText(/approve on your Ledger/i)).toBeInTheDocument();
    expectTrackPage(4, "approve view key share", { flow: "Add account" });
    expect(screen.getAllByTestId("confirmation-account-row").length).toEqual(3);

    await mockViewKeyProgressSubscription([
      { accountId: ALEO_ACCOUNT_1.id, viewKey: "vk_1" },
      { accountId: ALEO_ACCOUNT_2.id, viewKey: null }, // rejected
      { accountId: ALEO_ACCOUNT_3.id, viewKey: "vk_3" },
    ]);

    expect(screen.getByText(/2 accounts added to your portfolio/i)).toBeInTheDocument();
    expectTrackPage(5, "add account success");
  });

  it("should create an account", async () => {
    setup();

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([NEW_ALEO_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share view key" }));

    expect(screen.getByText(/approve on your Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("confirmation-account-row").length).toEqual(1);

    await mockViewKeyProgressSubscription([{ accountId: NEW_ALEO_ACCOUNT.id, viewKey: "vk_new" }]);

    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should navigate to fund an account", async () => {
    setup();

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1]);
    await userEvent.click(screen.getByRole("button", { name: "Share view key" }));

    expect(screen.getByText(/approve on your Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("confirmation-account-row").length).toEqual(1);

    await mockViewKeyProgressSubscription([{ accountId: ALEO_ACCOUNT_1.id, viewKey: "vk_1" }]);

    await userEvent.click(screen.getByRole("button", { name: "Add funds to my account" }));
    expect(track).toHaveBeenNthCalledWith(3, "button_clicked", {
      button: "Fund my account",
      flow: "Add account",
      page: "add account success",
    });

    const receive = screen.getByText(/receive crypto from another wallet/i);
    await userEvent.click(receive);
    expect(openModal).toHaveBeenCalledWith("MODAL_RECEIVE", expect.objectContaining({}));
  });

  it("should hide previously added accounts and show new account", async () => {
    setup({ accounts: [ALEO_ACCOUNT_1] });

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT]);

    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    expect(screen.queryByText(/we found 1 account/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share view key" }));

    expect(screen.getByText(/approve on your Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("confirmation-account-row").length).toEqual(1);

    await mockViewKeyProgressSubscription([{ accountId: NEW_ALEO_ACCOUNT.id, viewKey: "vk_new" }]);

    expect(screen.getByText(/account added to your portfolio/i)).toBeInTheDocument();
  });

  it("should error when all view keys are rejected", async () => {
    setup();

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1, ALEO_ACCOUNT_2]);

    expect(screen.queryByText(/we found 2 accounts/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Share view keys" }));

    expect(screen.getByText(/approve on your Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("confirmation-account-row").length).toEqual(2);

    await mockViewKeyProgressSubscription([
      { accountId: ALEO_ACCOUNT_1.id, viewKey: null },
      { accountId: ALEO_ACCOUNT_2.id, viewKey: null },
    ]);

    expectTrackPage(5, "cant add new account", { reason: "NO_ACCOUNTS_ADDED" });
    expect(screen.getByText("No Aleo accounts were added")).toBeInTheDocument();
  });

  it("should error on already imported empty account", async () => {
    setup({ accounts: [ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT] });

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT]);

    expectTrackPage(4, "cant add new account", { reason: "ALREADY_EMPTY_ACCOUNT" });
    expect(
      screen.getByText(
        "A new account cannot be added before you receive assets on your Aleo 4 account",
      ),
    ).toBeInTheDocument();
  });

  it("should allow name edit on already imported empty account", async () => {
    setup({ accounts: [ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT] });
    const OLD_NAME = "Aleo 4";
    const NEW_NAME = "My Edited Account";

    expect(screen.getByText(/set up aleo private balance/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(screen.getByText(/checking the blockchain/i)).toBeInTheDocument();
    await mockScanAccountsSubscription([ALEO_ACCOUNT_1, NEW_ALEO_ACCOUNT]);

    await userEvent.click(screen.getByRole("button", { name: /Edit account item/i }));
    expect(screen.getByText(/Edit account name/i)).toBeInTheDocument();

    const input = screen.getByRole("textbox", { name: "account name" });
    expect(input).toHaveValue(OLD_NAME);
    await userEvent.clear(input);
    await userEvent.type(input, NEW_NAME);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText(NEW_NAME)).toBeInTheDocument();
  });
});
