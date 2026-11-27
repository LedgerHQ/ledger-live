import React from "react";
import { renderHook } from "@testing-library/react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { AccountLike } from "@ledgerhq/types-live";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { context, type ContextValue } from "~/renderer/drawers/Provider";
import { useOperationDetailsHandlers } from "../useOperationDetailsHandlers";

function renderHandlers(accounts: AccountLike[]) {
  const setDrawer = jest.fn<void, Parameters<ContextValue["setDrawer"]>>();
  const drawer: ContextValue = {
    state: { Component: undefined, id: "", props: null, open: false, options: {} },
    setDrawer,
  };
  const { result } = renderHook(() => useOperationDetailsHandlers(accounts), {
    wrapper: ({ children }) => <context.Provider value={drawer}>{children}</context.Provider>,
  });
  const openOperationDetails = (params: unknown) =>
    result.current["custom.openOperationDetails"]({ params } as never, {} as never, {} as never);
  return { setDrawer, openOperationDetails };
}

describe("useOperationDetailsHandlers", () => {
  const account = genAccount("earn-deposit-account", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 3,
  });

  it("should open the OperationDetails drawer of the operation with the hash", async () => {
    const [deposit] = account.operations;
    setWalletApiIdForAccountId(account.id);
    const { setDrawer, openOperationDetails } = renderHandlers([account]);

    await openOperationDetails({
      accountId: getWalletApiIdFromAccountId(account.id),
      transactionHash: deposit.hash,
    });

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: deposit.id,
      accountId: account.id,
      parentId: undefined,
    });
  });

  it("should reject without opening a drawer when no operation has the hash", async () => {
    setWalletApiIdForAccountId(account.id);
    const { setDrawer, openOperationDetails } = renderHandlers([account]);

    await expect(
      openOperationDetails({
        accountId: getWalletApiIdFromAccountId(account.id),
        transactionHash: "0xunknown",
      }),
    ).rejects.toThrow("No operation 0xunknown");
    expect(setDrawer).not.toHaveBeenCalled();
  });
});
