import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { Operation } from "@ledgerhq/types-live";
import {
  createOpenInfoBottomSheetHandler,
  createOpenMenuBottomSheetHandler,
  createOpenOperationDetailsHandler,
  handlePTXCustomClose,
} from "../CustomHandlers";
import { createOpenActionDialogHandler, resolveActionDialog } from "../actionDialogStore";
import {
  makeSetEarnInfoBottomSheetAction,
  makeSetEarnMenuBottomSheetAction,
  makeSetEarnActionDialogAction,
} from "~/actions/earn";
import { NavigatorName, ScreenName } from "~/const";

function exposeToLiveApp(accountId: string): string {
  setWalletApiIdForAccountId(accountId);
  return getWalletApiIdFromAccountId(accountId);
}

describe("handlePTXCustomClose", () => {
  it("should go back when closing an exchange screen with navigation history", () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    handlePTXCustomClose(navigation, {
      screenName: ScreenName.ExchangeBuy,
      returnToPreviousScreenOnClose: true,
    });

    expect(navigation.canGoBack).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it("should navigate to main when closing an exchange screen without navigation history", () => {
    const navigation = {
      canGoBack: jest.fn(() => false),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    handlePTXCustomClose(navigation, {
      screenName: ScreenName.ExchangeBuy,
      returnToPreviousScreenOnClose: true,
    });

    expect(navigation.canGoBack).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  });

  it("should navigate to main when closing a non-exchange screen", () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    handlePTXCustomClose(navigation, {
      screenName: ScreenName.Card,
      returnToPreviousScreenOnClose: true,
    });

    expect(navigation.canGoBack).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  });

  it("should navigate to main when closing an exchange screen without the previous-screen flag", () => {
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: jest.fn(),
      navigate: jest.fn(),
    };

    handlePTXCustomClose(navigation, {
      screenName: ScreenName.ExchangeBuy,
      returnToPreviousScreenOnClose: false,
    });

    expect(navigation.canGoBack).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  });
});

describe("createOpenInfoBottomSheetHandler", () => {
  it("should dispatch with validated params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);
    const linkHref = "https://www.ledger.com";

    await handler({
      params: {
        title: "Info title",
        message: "Info message",
        linkText: "Learn more",
        linkHref,
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      makeSetEarnInfoBottomSheetAction({
        title: "Info title",
        message: "Info message",
        linkText: "Learn more",
        linkHref,
      }),
    );
  });

  it("should propagate validation errors from validateInfoDialogParams", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.info");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should reject disallowed URLs", async () => {
    const dispatch = jest.fn();
    const handler = createOpenInfoBottomSheetHandler(dispatch);

    await expect(
      handler({
        params: {
          title: "T",
          message: "M",
          linkHref: "https://example.com",
        },
      }),
    ).rejects.toThrow("'linkHref' is not an allowed URL");
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("createOpenMenuBottomSheetHandler", () => {
  const menuParams = [
    {
      icon: "Plus",
      label: "Deposit",
      metadata: {
        button: "earn",
        live_app: "earn",
        flow: "deposit",
        link: "ledgerlive://earn",
      },
    },
  ];

  it("should dispatch set menu bottom sheet action with params", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await handler({ params: menuParams });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(makeSetEarnMenuBottomSheetAction(menuParams));
  });

  it("should throw when params are missing", async () => {
    const dispatch = jest.fn();
    const handler = createOpenMenuBottomSheetHandler(dispatch);

    await expect(handler({})).rejects.toThrow("Missing params for custom.bottomSheet.menu");
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("createOpenActionDialogHandler", () => {
  const dialogParams = {
    title: "Swap required",
    description: "You need to swap before staking",
    ctaLabel: "Go to Swap",
    icon: "warning" as const,
  };

  afterEach(() => {
    resolveActionDialog(false);
  });

  it("should dispatch action dialog and return a promise", () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({ params: dialogParams });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(makeSetEarnActionDialogAction(dialogParams));
    expect(promise).toBeInstanceOf(Promise);
  });

  it("should throw when params have invalid fields", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    await expect(handler({ params: { title: "", description: "", ctaLabel: "" } })).rejects.toThrow(
      "Invalid params for custom.dialog.confirmation",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should resolve with confirmed true when resolveActionDialog(true) is called", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({ params: dialogParams });
    resolveActionDialog(true);

    await expect(promise).resolves.toEqual({ confirmed: true });
  });

  it("should resolve with confirmed false when resolveActionDialog(false) is called", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const promise = handler({ params: dialogParams });
    resolveActionDialog(false);

    await expect(promise).resolves.toEqual({ confirmed: false });
  });

  it("should dismiss previous pending dialog when opening a new one", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    const firstPromise = handler({ params: dialogParams });
    const secondPromise = handler({
      params: { ...dialogParams, title: "Second dialog" },
    });

    // First dialog should be auto-dismissed
    await expect(firstPromise).resolves.toEqual({ confirmed: false });

    // Second dialog is still pending until resolved
    resolveActionDialog(true);
    await expect(secondPromise).resolves.toEqual({ confirmed: true });
  });

  it("should dispatch undefined to clear dialog state on resolve", async () => {
    const dispatch = jest.fn();
    const handler = createOpenActionDialogHandler(dispatch);

    handler({ params: dialogParams });
    dispatch.mockClear();

    resolveActionDialog(true);

    expect(dispatch).toHaveBeenCalledWith(makeSetEarnActionDialogAction(undefined));
  });
});

describe("createOpenOperationDetailsHandler", () => {
  const DEPOSIT_HASH = "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060";
  const account = genAccount("earn-deposit-account", {
    currency: getCryptoCurrencyById("ethereum"),
    operationsSize: 3,
  });
  const tokenAccount = genTokenAccount(0, account, usdcToken);

  function withDepositHash(template: Operation): Operation {
    return {
      ...template,
      id: encodeOperationId(template.accountId, DEPOSIT_HASH, "OUT"),
      hash: DEPOSIT_HASH,
      type: "OUT",
    };
  }

  it("should open the operation details without a parent when the hash matches on a main account", async () => {
    const deposit = withDepositHash(account.operations[0]);
    const openOperationDetails = jest.fn();
    const handler = createOpenOperationDetailsHandler(
      [{ ...account, pendingOperations: [deposit] }],
      openOperationDetails,
    );

    await handler({
      params: { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
    });

    expect(openOperationDetails).toHaveBeenCalledWith({
      accountId: account.id,
      parentId: undefined,
      operation: deposit,
    });
  });

  it("should open the operation details with the parent id when the account is a token account", async () => {
    const tokenDeposit = withDepositHash(tokenAccount.operations[0]);
    const openOperationDetails = jest.fn();
    const handler = createOpenOperationDetailsHandler(
      [account, { ...tokenAccount, operations: [tokenDeposit] }],
      openOperationDetails,
    );

    await handler({
      params: { accountId: exposeToLiveApp(tokenAccount.id), transactionHash: DEPOSIT_HASH },
    });

    expect(openOperationDetails).toHaveBeenCalledWith({
      accountId: tokenAccount.id,
      parentId: account.id,
      operation: tokenDeposit,
    });
  });

  it("should reject without opening the operation details when the params are invalid", async () => {
    const openOperationDetails = jest.fn();
    const handler = createOpenOperationDetailsHandler([account], openOperationDetails);

    await expect(handler({ params: { transactionHash: DEPOSIT_HASH } })).rejects.toThrow(
      "Invalid params for custom.openOperationDetails",
    );
    expect(openOperationDetails).not.toHaveBeenCalled();
  });

  it("should reject without opening the operation details when no operation has the hash", async () => {
    const openOperationDetails = jest.fn();
    const handler = createOpenOperationDetailsHandler([account], openOperationDetails);

    await expect(
      handler({
        params: { accountId: exposeToLiveApp(account.id), transactionHash: DEPOSIT_HASH },
      }),
    ).rejects.toThrow("Operation not found");
    expect(openOperationDetails).not.toHaveBeenCalled();
  });
});
