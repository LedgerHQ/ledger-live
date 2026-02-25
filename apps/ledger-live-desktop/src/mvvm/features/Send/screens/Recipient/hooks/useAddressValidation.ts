import { useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { InvalidAddress } from "@ledgerhq/errors";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DomainServiceStatus } from "@ledgerhq/domain-service/hooks/types";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName, useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import { useBridgeRecipientValidation } from "./useBridgeRecipientValidation";
import { useFormattedAccountBalance } from "./useFormattedAccountBalance";
import { normalizeLastUsedTimestamp } from "../utils/dateFormatter";
import type {
  AddressSearchResult,
  AddressValidationStatus,
  AddressValidationError,
  MatchedAccount,
  BridgeValidationErrors,
  RecentAddress,
} from "../types";

function isDomainLoading(domain: DomainServiceStatus): boolean {
  return domain.status === "loading" || domain.status === "queued";
}

type UseAddressValidationProps = Readonly<{
  searchValue: string;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  currentAccountId?: string;
}>;

type UseAddressValidationResult = {
  result: AddressSearchResult;
  isLoading: boolean;
  validateAddress: () => Promise<void>;
};

export function useAddressValidation({
  searchValue,
  currency,
  account,
  parentAccount,
  currentAccountId,
}: UseAddressValidationProps): UseAddressValidationResult {
  const [validationState, setValidationState] = useState<{
    status: AddressValidationStatus;
    error: AddressValidationError;
    isSanctioned: boolean;
  }>({
    status: "idle",
    error: null,
    isSanctioned: false,
  });

  const lastSearchValueRef = useRef<string>("");
  const validationTriggeredRef = useRef<boolean>(false);

  const allAccounts = useSelector(accountsSelector);

  const isEthereum = currency.id === "ethereum";
  const domainServiceResponse = useDomain(isEthereum ? searchValue : "", "ens");
  const domainIsLoading = isEthereum && isDomainLoading(domainServiceResponse);

  const ensResolution = useMemo(() => {
    if (!isEthereum) return null;
    if (isLoaded(domainServiceResponse) && domainServiceResponse.resolutions.length > 0) {
      return domainServiceResponse.resolutions[0];
    }
    return null;
  }, [domainServiceResponse, isEthereum]);

  // Use resolved address for bridge validation (ENS resolved address or original searchValue)
  const addressForBridgeValidation = useMemo(() => {
    return ensResolution?.address ?? searchValue;
  }, [ensResolution?.address, searchValue]);

  // Bridge validation for recipient/sender errors and warnings
  const bridgeValidation = useBridgeRecipientValidation({
    recipient: addressForBridgeValidation,
    account: account ?? null,
    parentAccount: parentAccount ?? null,
    enabled: Boolean(
      addressForBridgeValidation && account && (!isEthereum || ensResolution || !domainIsLoading),
    ),
  });

  const userAccountsForCurrency = useMemo(() => {
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const allowSelfTransfer = selfTransferPolicy === "free" || selfTransferPolicy === "warning";

    return allAccounts.filter(acc => {
      if (currentAccountId && acc.id === currentAccountId && !allowSelfTransfer) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, currentAccountId]);

  const recentAddresses = useMemo(() => {
    const store = getRecentAddressesStore();
    const addressesWithMetadata = store.getAddresses(currency.id);
    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    return addressesWithMetadata.map(entry => {
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
  }, [currency, userAccountsForCurrency]);

  // Get account names for all user accounts to enable search by name
  const accountNames = useBatchMaybeAccountName(userAccountsForCurrency);

  const matchedRecentAddress = useMemo(() => {
    if (!searchValue) return undefined;
    const normalizedSearch = searchValue.toLowerCase();
    return recentAddresses.find(
      (recent: RecentAddress) =>
        recent.address.toLowerCase().includes(normalizedSearch) ||
        recent.name?.toLowerCase().includes(normalizedSearch) ||
        recent.ensName?.toLowerCase().includes(normalizedSearch),
    );
  }, [searchValue, recentAddresses]);

  const matchedLedgerAccounts = useMemo(() => {
    if (!searchValue) return [];
    const normalizedSearch = searchValue.toLowerCase();
    return userAccountsForCurrency.filter((acc, index) => {
      const name = accountNames[index];
      return (
        acc.freshAddress.toLowerCase().includes(normalizedSearch) ||
        name?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchValue, userAccountsForCurrency, accountNames]);

  const currentAccountName = useMaybeAccountName(
    account ? getMainAccount(account, parentAccount) : null,
  );

  const currentAccountMatch = useMemo(() => {
    if (!searchValue || !account) return null;

    const mainAccount = getMainAccount(account, parentAccount);
    const addressToCheck = ensResolution?.address ?? searchValue;
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    const normalizedSearch = searchValue.toLowerCase();
    const addressMatches = addressToCheck.toLowerCase() === mainAccount.freshAddress.toLowerCase();
    const nameMatches = currentAccountName?.toLowerCase().includes(normalizedSearch) ?? false;

    if (
      (addressMatches || nameMatches) &&
      (selfTransferPolicy === "free" || selfTransferPolicy === "warning")
    ) {
      return mainAccount;
    }

    return null;
  }, [searchValue, account, parentAccount, currency, ensResolution?.address, currentAccountName]);

  const matchedLedgerAccount = currentAccountMatch ?? matchedLedgerAccounts[0];

  const { formattedBalance, formattedCounterValue } =
    useFormattedAccountBalance(matchedLedgerAccount);
  const accountName = useMaybeAccountName(matchedLedgerAccount);

  const validateAddress = useCallback(async () => {
    if (!searchValue) {
      setValidationState({ status: "idle", error: null, isSanctioned: false });
      return;
    }

    setValidationState({ status: "loading", error: null, isSanctioned: false });

    try {
      const addressToCheck = ensResolution?.address ?? searchValue;

      const isCryptoCurrency = "id" in currency && !("tokenType" in currency);
      if (isCryptoCurrency) {
        const sanctioned = await isAddressSanctioned(currency, addressToCheck);
        if (sanctioned) {
          setValidationState({
            status: "sanctioned",
            error: "sanctioned",
            isSanctioned: true,
          });
          return;
        }
      }

      if (ensResolution) {
        setValidationState({
          status: "ens_resolved",
          error: null,
          isSanctioned: false,
        });
        return;
      }

      setValidationState({
        status: "valid",
        error: null,
        isSanctioned: false,
      });
    } catch {
      setValidationState({
        status: "invalid",
        error: "incorrect_format",
        isSanctioned: false,
      });
    }
  }, [searchValue, ensResolution, currency]);

  // Auto-validate when searchValue changes
  if (searchValue !== lastSearchValueRef.current) {
    lastSearchValueRef.current = searchValue;
    validationTriggeredRef.current = false;
    // If searchValue is cleared, immediately reset validation state
    if (!searchValue) {
      setValidationState({ status: "idle", error: null, isSanctioned: false });
    }
  }

  // Trigger validation once when searchValue changes
  if (searchValue && !validationTriggeredRef.current && validationState.status !== "loading") {
    validationTriggeredRef.current = true;
    // Use queueMicrotask to trigger validation after render
    queueMicrotask(() => {
      validateAddress();
    });
  }

  const result = useMemo((): AddressSearchResult => {
    const allMatchedAccounts = currentAccountMatch
      ? [
          currentAccountMatch,
          ...matchedLedgerAccounts.filter(acc => acc.id !== currentAccountMatch.id),
        ]
      : matchedLedgerAccounts;

    const isFirstInteraction = !matchedRecentAddress && allMatchedAccounts.length === 0;

    const matchedAccounts: MatchedAccount[] = allMatchedAccounts.map(acc => ({
      account: acc,
      accountName: undefined, // Will be resolved in the component
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
    }));

    const filteredBridgeErrors: BridgeValidationErrors = { ...bridgeValidation.errors };
    if (ensResolution && filteredBridgeErrors.recipient instanceof InvalidAddress) {
      delete filteredBridgeErrors.recipient;
    }

    return {
      status: validationState.status,
      error: validationState.error,
      resolvedAddress: matchedLedgerAccount?.freshAddress ?? ensResolution?.address,
      ensName: ensResolution?.domain,
      isLedgerAccount: allMatchedAccounts.length > 0,
      accountName,
      accountBalance: formattedBalance,
      accountBalanceFormatted: formattedCounterValue,
      isFirstInteraction,
      matchedRecentAddress,
      matchedAccounts,
      bridgeErrors: filteredBridgeErrors,
      bridgeWarnings: bridgeValidation.warnings,
    };
  }, [
    validationState,
    ensResolution,
    matchedLedgerAccount,
    matchedLedgerAccounts,
    currentAccountMatch,
    matchedRecentAddress,
    formattedBalance,
    formattedCounterValue,
    accountName,
    bridgeValidation.errors,
    bridgeValidation.warnings,
  ]);

  return {
    result,
    isLoading:
      validationState.status === "loading" || domainIsLoading || bridgeValidation.isLoading,
    validateAddress,
  };
}
