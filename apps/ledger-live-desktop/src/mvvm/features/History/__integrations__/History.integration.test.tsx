import React from "react";
import { render, screen, waitFor, within } from "tests/testSetup";
import { useNavigate } from "react-router";
import { setDrawer } from "~/renderer/drawers/Provider";
import { BTC_ACCOUNT, EMPTY_BTC_ACCOUNT } from "../../__mocks__/accounts.mock";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { Account } from "@ledgerhq/types-live";
import History from "../index";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  setDrawer: jest.fn(),
}));

jest.mock("@tanstack/react-virtual", () => ({
  ...jest.requireActual("@tanstack/react-virtual"),
  useVirtualizer: (opts: { count: number; estimateSize: (i: number) => number }) => {
    const items = Array.from({ length: opts.count }, (_, i) => {
      const size = opts.estimateSize(i);
      return { index: i, start: 0, end: size, size, key: i, lane: 0 };
    });
    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((sum, item) => sum + item.size, 0),
      measureElement: () => {},
      scrollToIndex: () => {},
    };
  },
}));

const mockedUseNavigate = jest.mocked(useNavigate);

describe("History integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  function renderHistory() {
    return render(<History />, {
      initialState: {
        accounts: [BTC_ACCOUNT],
        settings: AFTER_ONBOARDING_STATE,
      },
    });
  }

  it("should render the table header columns", async () => {
    renderHistory();

    await waitFor(() => {
      expect(screen.getByText("Type")).toBeVisible();
      expect(screen.getByText("Address")).toBeVisible();
      expect(screen.getByText("Amount")).toBeVisible();
      expect(screen.getByText("Value")).toBeVisible();
    });
  });

  it("should render operation rows from the account", async () => {
    renderHistory();

    await waitFor(() => {
      const table = screen.getByRole("table");
      const operationRows = within(table).getAllByRole("button");
      expect(operationRows.length).toBeGreaterThan(0);
    });
  });

  it("should open operation details drawer when clicking a row", async () => {
    const { user } = renderHistory();

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(within(table).getAllByRole("button").length).toBeGreaterThan(0);
    });

    const table = screen.getByRole("table");
    const operationRows = within(table).getAllByRole("button");
    await user.click(operationRows[0]);

    expect(setDrawer).toHaveBeenCalled();
  });

  it("should render a pending section header when account has pending operations", async () => {
    const pendingOp = {
      ...BTC_ACCOUNT.operations[0],
      id: "pending_op_1",
      hash: "pending_hash_1",
      blockHeight: null,
      date: new Date(),
    };

    const accountWithPending: Account = {
      ...BTC_ACCOUNT,
      pendingOperations: [pendingOp],
    };

    render(<History />, {
      initialState: {
        accounts: [accountWithPending],
        settings: AFTER_ONBOARDING_STATE,
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/pending transaction/i)).toBeVisible();
    });
  });

  it("should render empty state when there are no operations", async () => {
    render(<History />, {
      initialState: {
        accounts: [EMPTY_BTC_ACCOUNT],
        settings: AFTER_ONBOARDING_STATE,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("No transactions yet")).toBeVisible();
    });

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
