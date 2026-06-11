import React, { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "tests/testSetup";
import { useNavigate } from "react-router";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useExportOperationsCsv } from "~/renderer/hooks/useExportOperationsCsv";
import { BTC_ACCOUNT, ETH_ACCOUNT, EMPTY_BTC_ACCOUNT } from "../../__mocks__/accounts.mock";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import type { Account } from "@ledgerhq/types-live";
import History from "../index";

const mockNavigate = jest.fn();
let mockExportShouldSucceed = true;
let mockExportShouldError = false;

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

jest.mock("~/renderer/hooks/useExportOperationsCsv");
const mockedUseExportOperationsCsv = jest.mocked(useExportOperationsCsv);

const mockedUseNavigate = jest.mocked(useNavigate);

type ExportHookArgs = {
  onSuccess?: () => void;
  onError?: () => void;
};

function mockUseExportOperationsCsv({ onSuccess, onError }: ExportHookArgs) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  return {
    success,
    error,
    isLoading: false,
    exportCsv: async () => {
      if (mockExportShouldError) {
        setError(true);
        onError?.();
      } else if (mockExportShouldSucceed) {
        setSuccess(true);
        onSuccess?.();
      }
    },
    resetState: () => {
      setSuccess(false);
      setError(false);
    },
  };
}

function mockExportHook() {
  mockedUseExportOperationsCsv.mockImplementation(mockUseExportOperationsCsv);
}

describe("History integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockExportHook();
  });

  afterEach(() => {
    cleanup();
  });

  function renderHistory(accounts: Account[] = [BTC_ACCOUNT]) {
    return render(<History />, {
      initialState: {
        accounts,
        settings: AFTER_ONBOARDING_STATE,
      },
    });
  }

  it("marks operations as seen when leaving the History page", () => {
    const { unmount, store } = render(<History />, {
      initialState: {
        accounts: [BTC_ACCOUNT],
        settings: AFTER_ONBOARDING_STATE,
        history: { lastSeenOperationDate: null },
      },
    });

    expect(store.getState().history.lastSeenOperationDate).toBeNull();

    unmount();

    expect(store.getState().history.lastSeenOperationDate).not.toBeNull();
  });

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
      const table = screen.getByTestId("history-table-body");
      const operationRows = within(table).getAllByRole("button");
      expect(operationRows.length).toBeGreaterThan(0);
    });
  });

  it("should open operation details drawer when clicking a row", async () => {
    const { user } = renderHistory();

    await waitFor(() => {
      const table = screen.getByTestId("history-table-body");
      expect(within(table).getAllByRole("button").length).toBeGreaterThan(0);
    });

    const table = screen.getByTestId("history-table-body");
    const operationRows = within(table).getAllByRole("button");
    await user.click(operationRows[0]);

    expect(setDrawer).toHaveBeenCalled();
  });

  it("should render a pending section header when account has pending transactions", async () => {
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

  it("should render empty state when there are no transactions", async () => {
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

describe("History export dialog integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExportShouldSucceed = true;
    mockExportShouldError = false;
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockExportHook();
  });

  afterEach(() => {
    cleanup();
  });

  function renderHistoryWithAccounts() {
    return render(<History />, {
      initialState: {
        accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
        settings: AFTER_ONBOARDING_STATE,
      },
    });
  }

  async function openExportDialog(user: ReturnType<typeof renderHistoryWithAccounts>["user"]) {
    const exportButton = await screen.findByTestId("history-export-csv-button");
    await user.click(exportButton);
    return within(await screen.findByRole("dialog"));
  }

  async function selectAllAndExport(
    user: ReturnType<typeof renderHistoryWithAccounts>["user"],
    dialog: ReturnType<typeof within>,
  ) {
    await user.click(dialog.getByText(/select all/i));
    const exportButton = dialog.getByRole("button", { name: /export history/i });
    await waitFor(() => expect(exportButton).toBeEnabled());
    await user.click(exportButton);
  }

  it("should open dialog, list accounts, and toggle selection", async () => {
    const { user } = renderHistoryWithAccounts();
    const dialog = await openExportDialog(user);

    expect(dialog.getByText(/Bitcoin/)).toBeVisible();
    expect(dialog.getByText(/Ethereum/)).toBeVisible();

    const exportButton = dialog.getByRole("button", { name: /export history/i });
    expect(exportButton).toBeDisabled();

    await user.click(dialog.getByText(/select all/i));
    expect(exportButton).toBeEnabled();
    expect(dialog.getByText(/deselect all/i)).toBeVisible();

    await user.click(dialog.getByText(/deselect all/i));
    expect(exportButton).toBeDisabled();

    await user.click(dialog.getByText(/Bitcoin/));
    expect(exportButton).toBeEnabled();

    await user.click(dialog.getByText(/Bitcoin/));
    expect(exportButton).toBeDisabled();

    await user.keyboard("{Escape}");
  });

  it("should export selected accounts and show success scene", async () => {
    const { user } = renderHistoryWithAccounts();
    const dialog = await openExportDialog(user);

    await selectAllAndExport(user, dialog);

    expect(await screen.findByTestId("history-export-success-title")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /done/i }));
  });

  it("should stay on export scene when user cancels save dialog", async () => {
    const { user } = renderHistoryWithAccounts();
    const dialog = await openExportDialog(user);

    mockExportShouldSucceed = false;
    await selectAllAndExport(user, dialog);

    expect(screen.queryByTestId("history-export-success-title")).not.toBeInTheDocument();
    expect(screen.getByTestId("history-export-dialog")).toBeVisible();

    await user.keyboard("{Escape}");
  });

  it("should show error scene on export failure and allow retry", async () => {
    const { user } = renderHistoryWithAccounts();
    const dialog = await openExportDialog(user);

    mockExportShouldError = true;
    await selectAllAndExport(user, dialog);

    await waitFor(() => expect(screen.getByTestId("history-export-error-title")).toBeVisible(), {
      timeout: 10000,
    });

    await user.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(screen.getByTestId("history-export-dialog")).toBeVisible(), {
      timeout: 10000,
    });
    expect(screen.queryByTestId("history-export-error-title")).not.toBeInTheDocument();
  }, 30000);
});
