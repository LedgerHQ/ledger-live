import { useCallback, useMemo, useState } from "react";
import { useSelector } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useRecipientSearchState } from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientSearchState";
import { normalizeLastUsedTimestamp } from "@ledgerhq/live-common/flows/send/recipient/utils/dateFormatter";
import type { Account, RecentAddress as RecentAddressFromStore } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";
import { useAddressValidation } from "./useAddressValidation";
import { useSendFlowData, useSendFlowActions } from "../../../context/SendFlowContext";
import type { RecentAddress, RecipientScreenViewProps } from "../types";
import { SendFlowNavigationProp } from "../../../types";

type UseRecipientScreenViewModelResult = Omit<RecipientScreenViewProps, never>;

export function useRecipientScreenViewModel(): UseRecipientScreenViewModelResult {
  const { state, recipientSearchValue, uiConfig } = useSendFlowData();
  const { transaction, setRecipientSearchValue } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [clipboardAddress, setClipboardAddress] = useState<string | null>(null);

  const account = state.account.account;
  const parentAccount = state.account.parentAccount;
  const currency = state.account.currency;

  const mainAccount =
    account && parentAccount !== undefined ? getMainAccount(account, parentAccount) : null;

  const { result, isLoading } = useAddressValidation({
    searchValue: recipientSearchValue,
    currency: currency as CryptoCurrency | TokenCurrency,
    account: account ?? undefined,
    parentAccount: parentAccount ?? undefined,
    currentAccountId: mainAccount?.id,
  });

  const allAccountTuples = useSelector(state =>
    currency ? accountsByCryptoCurrencyScreenSelector(currency)(state) : [],
  );

  const userAccountsForCurrency = useMemo(() => {
    if (!currency || !mainAccount) return [];
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const allowSelfTransfer = selfTransferPolicy === "free" || selfTransferPolicy === "warning";

    return allAccountTuples
      .filter((tuple): tuple is typeof tuple & { account: Account } => {
        const { account } = tuple;
        if (account.type !== "Account") return false;
        if (account.id === mainAccount.id && !allowSelfTransfer) return false;
        const accCurrency = getAccountCurrency(account);
        return accCurrency.id === currency.id;
      })
      .map(t => t.account);
  }, [allAccountTuples, currency, mainAccount]);

  const recentAddresses = useMemo(() => {
    if (!currency) return [];
    const addressesWithMetadata = getRecentAddressesStore().getAddresses(
      currency.id,
    ) as unknown as RecentAddressFromStore[];
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    return addressesWithMetadata
      .filter(entry => {
        if (!entry?.address) return false;
        if (
          mainAccount &&
          selfTransferPolicy === "impossible" &&
          entry.address.toLowerCase() === mainAccount.freshAddress.toLowerCase()
        ) {
          return false;
        }
        return true;
      })
      .map(entry => {
        const matchedAccount = userAccountsByAddress.get(entry.address.toLowerCase());
        const lastUsedTimestamp = normalizeLastUsedTimestamp(entry.lastUsed);
        const recentAddress: RecentAddress = {
          address: entry.address,
          currency,
          lastUsedAt: new Date(lastUsedTimestamp),
          name: entry.address,
          ensName: entry.ensName,
          isLedgerAccount: !!matchedAccount,
          accountId: matchedAccount?.id,
        };
        return recentAddress;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, refreshCounter, mainAccount?.freshAddress, userAccountsForCurrency]);

  // Check clipboard for valid address
  useMemo(() => {
    Clipboard.getString().then(text => {
      if (text && text.startsWith("0x") && text.length >= 40) {
        setClipboardAddress(text);
      } else {
        setClipboardAddress(null);
      }
    });
  }, []);

  const hasSearchValue = recipientSearchValue.length > 0;
  const showInitialState = !hasSearchValue;

  const hasRecentAddresses = recentAddresses.length > 0;
  const hasUserAccounts = userAccountsForCurrency.length > 0;
  const showInitialEmptyState = showInitialState && !hasRecentAddresses && !hasUserAccounts;

  const handlePasteFromClipboard = useCallback(() => {
    if (clipboardAddress) {
      setRecipientSearchValue(clipboardAddress);
    }
  }, [clipboardAddress, setRecipientSearchValue]);

  const handleAddressSelected = useCallback(
    (address: string, ensName?: string) => {
      transaction.setRecipient({
        address,
        ensName,
      });
      navigation.navigate(ScreenName.SendFlowAmount);
    },
    [transaction, navigation],
  );

  const handleRecentAddressSelect = useCallback(
    (address: RecentAddress) => {
      handleAddressSelected(address.address, address.ensName);
    },
    [handleAddressSelected],
  );

  const handleAccountSelect = useCallback(
    (selectedAccount: Account) => {
      handleAddressSelected(selectedAccount.freshAddress);
    },
    [handleAddressSelected],
  );

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      handleAddressSelected(address, ensName);
    },
    [handleAddressSelected],
  );

  const handleRemoveAddress = useCallback(
    (address: RecentAddress) => {
      if (currency) {
        getRecentAddressesStore().removeAddress(currency.id, address.address);
        setRefreshCounter(prev => prev + 1);
      }
    },
    [currency],
  );

  const searchState = useRecipientSearchState({
    searchValue: recipientSearchValue,
    result,
    isLoading,
    recipientSupportsDomain: uiConfig.recipientSupportsDomain,
  });

  if (!mainAccount || !currency) {
    return {
      searchValue: "",
      isLoading: false,
      result: {
        status: "idle",
        error: null,
        resolvedAddress: undefined,
        ensName: undefined,
        isLedgerAccount: false,
        accountName: undefined,
        accountBalance: undefined,
        accountBalanceFormatted: undefined,
        isFirstInteraction: true,
        matchedRecentAddress: undefined,
        matchedAccounts: [],
        bridgeErrors: undefined,
        bridgeWarnings: undefined,
      },
      recentAddresses: [],
      mainAccount: {} as Account,
      currency: {} as CryptoCurrency,
      clipboardAddress: null,
      showInitialState: true,
      showInitialEmptyState: true,
      showMatchedAddress: false,
      showAddressValidationError: false,
      showEmptyState: false,
      showBridgeSenderError: false,
      showSanctionedBanner: false,
      showBridgeRecipientError: false,
      showBridgeRecipientWarning: false,
      isSanctioned: false,
      isAddressComplete: false,
      addressValidationErrorType: null,
      bridgeRecipientError: undefined,
      bridgeRecipientWarning: undefined,
      bridgeSenderError: undefined,
      onPasteFromClipboard: handlePasteFromClipboard,
      onRecentAddressSelect: handleRecentAddressSelect,
      onAccountSelect: handleAccountSelect,
      onAddressSelect: handleAddressSelect,
      onRemoveAddress: handleRemoveAddress,
    };
  }

  return {
    searchValue: recipientSearchValue,
    isLoading,
    result,
    recentAddresses,
    mainAccount,
    currency,
    clipboardAddress,
    showInitialState,
    showInitialEmptyState,
    onPasteFromClipboard: handlePasteFromClipboard,
    onRecentAddressSelect: handleRecentAddressSelect,
    onAccountSelect: handleAccountSelect,
    onAddressSelect: handleAddressSelect,
    onRemoveAddress: handleRemoveAddress,
    ...searchState,
  };
}
