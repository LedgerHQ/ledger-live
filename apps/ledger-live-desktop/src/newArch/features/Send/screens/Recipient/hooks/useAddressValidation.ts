import { useState, useMemo, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
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

type UseAddressValidationProps = {
  searchValue: string;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  currentAccountId?: string;
};

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

  const recentAddresses = useMemo(() => {
    const addresses = getRecentAddressesStore().getAddresses(currency.id);
    return addresses.map(
      address =>
        ({
          address,
          currency,
          lastUsedAt: new Date(),
          name: address,
        }) as RecentAddress,
    );
  }, [currency]);

  const userAccountsForCurrency = useMemo(() => {
    return allAccounts.filter(acc => {
      if (currentAccountId && acc.id === currentAccountId) return false;
      const accCurrency = getAccountCurrency(acc);
      return accCurrency.id === currency.id;
    });
  }, [allAccounts, currency, currentAccountId]);

  // Get account names for all user accounts to enable search by name
  const accountNames = useBatchMaybeAccountName(userAccountsForCurrency);

  const matchedRecentAddress = useMemo(() => {
    if (!searchValue) return undefined;
    const normalizedSearch = searchValue.toLowerCase();
    return recentAddresses.find(
      recent =>
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
      // Search by address or account name
      return (
        acc.freshAddress.toLowerCase().includes(normalizedSearch) ||
        name?.toLowerCase().includes(normalizedSearch)
      );
    }) as Account[];
  }, [searchValue, userAccountsForCurrency, accountNames]);

  // Check if the searched address matches the current account address
  // and if self-transfer is allowed for this currency
  const currentAccountMatch = useMemo(() => {
    if (!searchValue || !account) return null;

    const mainAccount = getMainAccount(account, parentAccount);
    const addressToCheck = ensResolution?.address ?? searchValue;
    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);

    // Check if address matches current account and self-transfer is allowed
    if (
      addressToCheck.toLowerCase() === mainAccount.freshAddress.toLowerCase() &&
      (selfTransferPolicy === "free" || selfTransferPolicy === "warning")
    ) {
      return mainAccount as Account;
    }

    return null;
  }, [searchValue, account, parentAccount, currency, ensResolution?.address]);

  // Keep first matched account (prioritize current account match if it exists)
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

      // Check if address is sanctioned
      const isCryptoCurrency = "id" in currency && !("tokenType" in currency);
      if (isCryptoCurrency) {
        const sanctioned = await isAddressSanctioned(currency as CryptoCurrency, addressToCheck);
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
    // Include current account match in the list if it exists
    const allMatchedAccounts = currentAccountMatch
      ? [currentAccountMatch, ...matchedLedgerAccounts]
      : matchedLedgerAccounts;

    const isFirstInteraction = !matchedRecentAddress && allMatchedAccounts.length === 0;

    // Build matched accounts list with their balances
    const matchedAccounts: MatchedAccount[] = allMatchedAccounts.map(acc => ({
      account: acc,
      accountName: undefined, // Will be resolved in the component
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
    }));

    // Filter out InvalidAddress errors from bridge if ENS is resolved (for eth)
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
