import React from "react";
import { Observable, Subject } from "rxjs";
import { setEnv } from "@ledgerhq/live-env";
import type { Account } from "@ledgerhq/types-live";
import { act } from "react-dom/test-utils";
import { render, screen, userEvent } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import type { State } from "~/renderer/reducers";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import ModularDrawerAddAccountFlowManager from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import { ALEO_ACCOUNT_1, ALEO_ACCOUNT_2, ALEO_ACCOUNT_3 } from "../__mocks__/accounts.mock";
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

const mockAccountBridge = {
  assignToAccountRaw: () => {},
  assignToTokenAccountRaw: () => {},
  toOperationExtraRaw: (extra: unknown) => extra,
};

const mockNavigate = jest.fn();

let progress$: Subject<unknown>;
let triggerNext: (accounts: Account[]) => void = () => null;
let triggerComplete: () => void = () => null;

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
  getAccountBridge: () => mockAccountBridge,
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
  await act(() => triggerComplete());
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

    expectTrackPage(2, "confirm view key warning", { flow: "Add account" });
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
});
