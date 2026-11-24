import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { createDialogInfoHandler, createOpenOperationDetailsHandler } from "../CustomHandlers";
import { resolveActionDialog, createOpenActionDialogHandler } from "../actionDialogStore";
import { setPtxInfoDialog } from "~/renderer/reducers/ptxInfoDialog";
import { setActionDialog } from "~/renderer/reducers/actionDialog";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";

function exposeToLiveApp(accountId: string): string {
  setWalletApiIdForAccountId(accountId);
  return getWalletApiIdFromAccountId(accountId);
}

describe("createDialogInfoHandler", () => {
  it("should dispatch setPtxInfoDialog with validated params", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await handler({
      params: {
        title: "Staking info",
        message: "Delegate to earn.",
        linkText: "Learn more",
        linkHref: "https://www.ledger.com",
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      setPtxInfoDialog({
        title: "Staking info",
        message: "Delegate to earn.",
        linkText: "Learn more",
        linkHref: "https://www.ledger.com",
      }),
    );
  });

  it("should propagate validation errors from validateInfoDialogParams", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await expect(handler({} as Parameters<typeof handler>[0])).rejects.toThrow(
      "Missing params for custom.dialog.info",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should reject disallowed URLs", async () => {
    const dispatch = jest.fn();
    const handler = createDialogInfoHandler(dispatch);

    await expect(
      handler({
        params: {
          title: "T",
          message: "M",
          linkHref: "https://evil.example.com",
        },
      }),
    ).rejects.toThrow("'linkHref' is not an allowed URL");
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("createOpenActionDialogHandler", () => {
  afterEach(() => {
    resolveActionDialog(false);
  });

  it("should dispatch setActionDialog with validated params and return a promise", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({
      params: {
        title: "Swap required",
        description: "You need to swap first",
        ctaLabel: "Go to Swap",
      },
    });

    expect(dispatch).toHaveBeenCalledWith(
      setActionDialog({
        title: "Swap required",
        description: "You need to swap first",
        ctaLabel: "Go to Swap",
      }),
    );

    // Resolve the pending dialog
    resolveActionDialog(true);
    const result = await promise;
    expect(result).toEqual({ confirmed: true });
  });

  it("should dismiss previous dialog when opening a new one", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const firstPromise = handler({
      params: {
        title: "First",
        description: "First dialog",
        ctaLabel: "OK",
      },
    });

    const secondPromise = handler({
      params: {
        title: "Second",
        description: "Second dialog",
        ctaLabel: "OK",
      },
    });

    // First dialog should have been auto-dismissed
    const firstResult = await firstPromise;
    expect(firstResult).toEqual({ confirmed: false });

    // Resolve the second dialog
    resolveActionDialog(true);
    const secondResult = await secondPromise;
    expect(secondResult).toEqual({ confirmed: true });
  });

  it("should clear Redux state when resolving", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({
      params: {
        title: "Test",
        description: "Test description",
        ctaLabel: "Confirm",
      },
    });

    resolveActionDialog(true);
    await promise;

    expect(dispatch).toHaveBeenCalledWith(setActionDialog(null));
  });

  it("should propagate validation errors", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    await expect(handler({} as Parameters<typeof handler>[0])).rejects.toThrow(
      "Invalid params for custom.dialog.confirmation: params are required.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("createOpenOperationDetailsHandler", () => {
  const DEPOSIT_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
  const account = genAccount("earn-deposit-account", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 3,
  });
  const tokenAccount = genTokenAccount(0, account, usdcToken);

  function withDepositHash(template: Operation, type: OperationType): Operation {
    return {
      ...template,
      id: encodeOperationId(template.accountId, DEPOSIT_HASH, type),
      hash: DEPOSIT_HASH,
      type,
    };
  }

  it("should open the OperationDetails drawer without a parent when the hash matches on a main account", async () => {
    const deposit = withDepositHash(account.operations[0], "OUT");
    const setDrawer = jest.fn();
    const handler = createOpenOperationDetailsHandler(
      [{ ...account, pendingOperations: [deposit] }],
      setDrawer,
    );

    await handler({
      params: { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
    });

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: deposit.id,
      accountId: account.id,
      parentId: undefined,
    });
  });

  it("should open the OperationDetails drawer with the parent id when the account is a token account", async () => {
    const tokenDeposit = withDepositHash(tokenAccount.operations[0], "OUT");
    const setDrawer = jest.fn();
    const handler = createOpenOperationDetailsHandler(
      [account, { ...tokenAccount, operations: [tokenDeposit] }],
      setDrawer,
    );

    await handler({
      params: { accountId: exposeToLiveApp(tokenAccount.id), transactionHash: DEPOSIT_HASH },
    });

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: tokenDeposit.id,
      accountId: tokenAccount.id,
      parentId: account.id,
    });
  });

  it("should open the confirmed fees operation when a sync replaced the pending operation of the hash", async () => {
    const confirmedDeposit = withDepositHash(account.operations[0], "FEES");
    const setDrawer = jest.fn();
    const handler = createOpenOperationDetailsHandler(
      [{ ...account, operations: [confirmedDeposit, ...account.operations] }],
      setDrawer,
    );

    await handler({
      params: { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
    });

    expect(setDrawer).toHaveBeenCalledWith(OperationDetails, {
      operationId: confirmedDeposit.id,
      accountId: account.id,
      parentId: undefined,
    });
  });

  it("should reject without opening a drawer when the params are invalid", async () => {
    const setDrawer = jest.fn();
    const handler = createOpenOperationDetailsHandler([account], setDrawer);

    await expect(handler({ params: { accountId: exposeToLiveApp(account.id) } })).rejects.toThrow(
      "Invalid params for custom.openOperationDetails",
    );
    expect(setDrawer).not.toHaveBeenCalled();
  });

  it("should reject without opening a drawer when no operation has the hash", async () => {
    const setDrawer = jest.fn();
    const handler = createOpenOperationDetailsHandler([account], setDrawer);

    await expect(
      handler({
        params: { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      }),
    ).rejects.toThrow("Operation not found");
    expect(setDrawer).not.toHaveBeenCalled();
  });
});
