import { selectContacts } from "@domain/entity-contact";
import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import type { DomainServiceStatus } from "@ledgerhq/domain-service/hooks/types";
import { InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getAccountCurrency,
  getMainAccount,
  getRecentAddressesStore,
} from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { useMaybeAccountName } from "~/reducers/wallet";

import { useBridgeRecipientValidation } from "@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation";
import { findMatchedContact } from "@ledgerhq/live-common/flows/send/recipient/utils/findMatchedContact";
import type {
  AddressSearchResult,
  AddressValidationError,
  AddressValidationStatus,
  BridgeValidationErrors,
  MatchedAccount,
  RecentAddress,
} from "@ledgerhq/live-common/flows/send/recipient/types";
import { normalizeLastUsedTimestamp } from "../utils/dateFormatter";
import { useFormattedAccountBalance } from "LLM/hooks/useFormattedAccountBalance";

function isDomainLoading(domain: DomainServiceStatus): boolean {
  return domain.status === "loading" || domain.status === "queued";
}

type UseAddressValidationProps = Readonly<{
  searchValue: string;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account | null;
  transaction?: Transaction | null;
  currentAccountId?: string;
  recipientSupportsDomain?: boolean;
  canSearchContactsByName?: boolean;
  /** Debounce before bridge validation. Pass 0 for one-shot values (e.g. clipboard). */
  debounceMs?: number;
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
  transaction,
  currentAccountId,
  recipientSupportsDomain = false,
  canSearchContactsByName = false,
  debounceMs,
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

  const lastValidationKeyRef = useRef<string>("");
  const validationTriggeredRef = useRef<boolean>(false);

  const allAccounts = useSelector(accountsSelector);
  const contacts = useSelector(selectContacts);

  const domainServiceResponse = useDomain(recipientSupportsDomain ? searchValue : "", "ens");
  const domainIsLoading = recipientSupportsDomain && isDomainLoading(domainServiceResponse);

  const ensResolution = useMemo(() => {
    if (!recipientSupportsDomain) return null;
    if (isLoaded(domainServiceResponse) && domainServiceResponse.resolutions.length > 0) {
      return domainServiceResponse.resolutions[0];
    }
    return null;
  }, [domainServiceResponse, recipientSupportsDomain]);

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount) : null),
    [account, parentAccount],
  );
  const sanctionCurrency = currency.type === "TokenCurrency" ? mainAccount?.currency : currency;

  const matchedContact = useMemo(() => {
    if (!searchValue || !sanctionCurrency) {
      return undefined;
    }

    return findMatchedContact(contacts, searchValue, currency.id, ensResolution?.address, {
      matchName: canSearchContactsByName && !domainIsLoading,
    });
  }, [
    canSearchContactsByName,
    contacts,
    currency.id,
    domainIsLoading,
    ensResolution?.address,
    sanctionCurrency,
    searchValue,
  ]);

  const addressForBridgeValidation = useMemo(() => {
    return matchedContact?.address ?? ensResolution?.address ?? searchValue;
  }, [ensResolution?.address, matchedContact?.address, searchValue]);
  const validationKey = `${sanctionCurrency?.id ?? ""}:${addressForBridgeValidation}`;

  // Bridge validation for recipient/sender errors and warnings
  const bridgeValidation = useBridgeRecipientValidation({
    recipient: addressForBridgeValidation,
    account: account ?? null,
    parentAccount: parentAccount ?? null,
    transaction,
    enabled: Boolean(
      addressForBridgeValidation &&
      account &&
      (matchedContact || !recipientSupportsDomain || ensResolution || !domainIsLoading),
    ),
    debounceMs,
  });

  const hasInvalidBridgeRecipient =
    bridgeValidation.errors.recipient?.name === "InvalidAddress" && !ensResolution;
  const canMatchValidatedRecipient = Boolean(searchValue) && !hasInvalidBridgeRecipient;

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
    if (!canMatchValidatedRecipient) return [];

    const normalizedRecipientAddress = addressForBridgeValidation.toLowerCase();
    return userAccountsForCurrency.filter(
      acc => acc.freshAddress.toLowerCase() === normalizedRecipientAddress,
    );
  }, [canMatchValidatedRecipient, userAccountsForCurrency, addressForBridgeValidation]);

  const currentAccountMatch = useMemo(() => {
    if (!canMatchValidatedRecipient || !account || !mainAccount) return null;

    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const addressMatches =
      addressForBridgeValidation.toLowerCase() === mainAccount.freshAddress.toLowerCase();

    if (addressMatches && (selfTransferPolicy === "free" || selfTransferPolicy === "warning")) {
      return mainAccount;
    }

    return null;
  }, [canMatchValidatedRecipient, account, mainAccount, currency, addressForBridgeValidation]);

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
      const addressToCheck = matchedContact?.address ?? ensResolution?.address ?? searchValue;

      if (sanctionCurrency) {
        const sanctioned = await isAddressSanctioned(sanctionCurrency, addressToCheck);
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
  }, [searchValue, matchedContact?.address, ensResolution, sanctionCurrency]);

  // Revalidate when the effective address changes, including after ENS resolution.
  if (validationKey !== lastValidationKeyRef.current) {
    lastValidationKeyRef.current = validationKey;
    validationTriggeredRef.current = false;
    // If searchValue is cleared, immediately reset validation state
    if (!searchValue) {
      setValidationState({ status: "idle", error: null, isSanctioned: false });
    }
  }

  // Trigger validation once for each effective address.
  if (
    addressForBridgeValidation &&
    !validationTriggeredRef.current &&
    validationState.status !== "loading"
  ) {
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

    const isFirstInteraction =
      !matchedRecentAddress && allMatchedAccounts.length === 0 && !matchedContact;

    const matchedAccounts: MatchedAccount[] = allMatchedAccounts.map(acc => ({
      account: acc,
      accountName: undefined, // Will be resolved in the component
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
    }));

    const filteredBridgeErrors: BridgeValidationErrors = { ...bridgeValidation.errors };
    if (ensResolution && filteredBridgeErrors.recipient?.name === "InvalidAddress") {
      delete filteredBridgeErrors.recipient;
    }

    const isImpossibleSelfTransferAttempt =
      mainAccount &&
      sendFeatures.getSelfTransferPolicy(currency) === "impossible" &&
      addressForBridgeValidation.toLowerCase() === mainAccount.freshAddress.toLowerCase();

    if (isImpossibleSelfTransferAttempt && !filteredBridgeErrors.recipient) {
      filteredBridgeErrors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    return {
      status: validationState.status,
      error: validationState.error,
      resolvedAddress:
        matchedLedgerAccount?.freshAddress ?? matchedContact?.address ?? ensResolution?.address,
      ensName: ensResolution?.domain,
      isLedgerAccount: allMatchedAccounts.length > 0,
      accountName,
      accountBalance: formattedBalance,
      accountBalanceFormatted: formattedCounterValue,
      isFirstInteraction,
      matchedRecentAddress,
      matchedAccounts,
      matchedContact,
      bridgeErrors: filteredBridgeErrors,
      bridgeWarnings: bridgeValidation.warnings,
      isBridgeLoading: bridgeValidation.isLoading && bridgeValidation.status === null,
      hasBridgeValidationResult: bridgeValidation.status !== null,
    };
  }, [
    validationState,
    ensResolution,
    matchedLedgerAccount,
    matchedLedgerAccounts,
    currentAccountMatch,
    matchedRecentAddress,
    matchedContact,
    formattedBalance,
    formattedCounterValue,
    accountName,
    mainAccount,
    currency,
    addressForBridgeValidation,
    bridgeValidation.errors,
    bridgeValidation.warnings,
    bridgeValidation.isLoading,
    bridgeValidation.status,
  ]);

  return {
    result,
    isLoading:
      validationState.status === "loading" ||
      (domainIsLoading && !matchedContact) ||
      (bridgeValidation.isLoading && bridgeValidation.status === null),
    validateAddress,
  };
}
