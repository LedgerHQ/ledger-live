import {
  findCryptoCurrencyByKeyword,
  parseCurrencyUnit,
} from "@ledgerhq/live-common/currencies/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { closeAllModal, openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { DeeplinkHandler, DeeplinkHandlerContext } from "../types";
import { getAccountsOrSubAccountsByCurrency } from "../utils";

/**
 * Handles deep link navigation for send, receive, and delegate flows.
 *
 *
 * @flow
 * 1. **No currency parameter**
 *    - Opens the modal without account pre-selection
 *    - User can select any available account
 *
 * 2. **Currency not found**
 *    - Redirects to Asset Flow to help user discover the asset
 *    - (Not applicable to delegate flow)
 *
 * 3. **Currency found, but user has no accounts**
 *    - Redirects to Add Account Flow
 *    - Callback provided to reopen modal after account creation
 *
 * 4. **Currency found with existing accounts**
 *    - Opens modal with first matching account pre-selected
 *    - For tokens: includes both token account and parent account
 *
 * @example Basic flows
 * ledgerwallet://send                    // Open send modal, no pre-selection
 * ledgerwallet://receive?currency=btc    // Receive Bitcoin
 * ledgerwallet://delegate?currency=tezos // Delegate Tezos
 *
 * @example Send with pre-filled data
 * ledgerwallet://send?currency=ethereum&recipient=0x581A5bbcE3AED0B928B3F48842BaDA3F9C360d97&amount=0.0001
 *
 */
async function handleTransactionFlow(
  flowType: "send" | "receive" | "delegate",
  currency: string | undefined,
  recipient: string | undefined,
  amount: string | undefined,
  context: DeeplinkHandlerContext,
): Promise<void> {
  const {
    dispatch,
    accounts,
    openAddAccountFlow,
    openAssetFlow,
    openSendFlow,
  } = context;

  const modalMap = {
    send: "MODAL_SEND",
    delegate: "MODAL_DELEGATE",
    receive: "MODAL_RECEIVE",
  } as const;
  const modal = modalMap[flowType];

  const sendRecipient = typeof recipient === "string" ? recipient : undefined;
  const sendAmount = typeof amount === "string" ? amount : undefined;

  dispatch(closeAllModal());
  setDrawer();

  if (!currency) {
    if (flowType === "send") {
      openSendFlow({
        recipient: sendRecipient,
        amount: sendAmount,
      });
    } else {
      dispatch(
        openModal(modal, {
          ...(flowType === "receive" ? { shouldUseReceiveOptions: false } : {}),
        }),
      );
    }
    return;
  }

  let foundCurrency;
  try {
    const currencyId = typeof currency === "string" ? currency : "";
    foundCurrency =
      findCryptoCurrencyByKeyword(currencyId) ||
      (await getCryptoAssetsStore().findTokenById(currencyId)) ||
      null;
  } catch {
    foundCurrency = null;
  }

  const openModalWithAccount = (
    account: Account | TokenAccount,
    parentAccount?: Account,
  ) => {
    if (flowType === "send") {
      openSendFlow({
        account,
        parentAccount,
        recipient: sendRecipient,
        amount: sendAmount,
      });
      return;
    }

    dispatch(
      openModal(modal, {
        ...(flowType === "receive" ? { shouldUseReceiveOptions: false } : {}),
        recipient,
        account,
        parentAccount,
        amount:
          amount && typeof amount === "string" && foundCurrency
            ? parseCurrencyUnit(foundCurrency.units[0], amount)
            : undefined,
      }),
    );
  };

  if (!foundCurrency) {
    openAssetFlow();
    return;
  }

  const matchingAccounts = getAccountsOrSubAccountsByCurrency(foundCurrency, accounts || []);

  if (!matchingAccounts.length) {
    openAddAccountFlow(foundCurrency, true, openModalWithAccount);
    return;
  }

  const [selectedAccount] = matchingAccounts;

  if (selectedAccount?.type === "Account") {
    openModalWithAccount(selectedAccount);
  } else {
    const parentAccount = accounts.find(acc => acc.id === selectedAccount?.parentId);
    if (parentAccount && selectedAccount) {
      openModalWithAccount(selectedAccount, parentAccount);
    }
  }
}

export const sendHandler: DeeplinkHandler<"send"> = async (route, context) => {
  await handleTransactionFlow("send", route.currency, route.recipient, route.amount, context);
};

export const receiveHandler: DeeplinkHandler<"receive"> = async (route, context) => {
  await handleTransactionFlow("receive", route.currency, route.recipient, route.amount, context);
};

export const delegateHandler: DeeplinkHandler<"delegate"> = async (route, context) => {
  if (route.currency !== "tezos") return;

  await handleTransactionFlow("delegate", route.currency, route.recipient, route.amount, context);
};
