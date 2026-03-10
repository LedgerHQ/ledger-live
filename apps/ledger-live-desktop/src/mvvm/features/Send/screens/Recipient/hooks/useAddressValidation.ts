import { isAddressSanctioned } from "@ledgerhq/coin-framework/sanction/index";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import type { DomainServiceStatus } from "@ledgerhq/domain-service/hooks/types";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { useBridgeRecipientValidation } from "@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation";
import type {
  AddressSearchResult,
  AddressValidationError,
  AddressValidationStatus,
  BridgeValidationErrors,
  MatchedAccount,
  RecentAddress,
} from "@ledgerhq/live-common/flows/send/recipient/types";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo, useRef, useState } from "react";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useFormattedAccountBalance } from "./useFormattedAccountBalance";

function isDomainLoading(domain: DomainServiceStatus): boolean {
  return domain.status === "loading" || domain.status === "queued";
}

const OUTGOING_OPERATION_TYPES = new Set<Operation["type"]>(["OUT"]);

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

  const mainAccount = useMemo(
    () => (account ? getMainAccount(account, parentAccount) : null),
    [account, parentAccount],
  );

  // Bridge validation for recipient/sender errors and warnings
  const bridgeValidation = useBridgeRecipientValidation({
    recipient: addressForBridgeValidation,
    account: account ?? null,
    parentAccount: parentAccount ?? null,
    enabled: Boolean(
      addressForBridgeValidation && account && (!isEthereum || ensResolution || !domainIsLoading),
    ),
  });

  const hasInvalidBridgeRecipient =
    bridgeValidation.errors.recipient instanceof InvalidAddress && !ensResolution;
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

  const recentSendRecipients = useMemo(() => {
    const loadedOperations = account?.operations ?? [];
    const userAccountsByAddress = new Map(
      userAccountsForCurrency.map(acc => [acc.freshAddress.toLowerCase(), acc]),
    );

    const deduplicatedAddresses = new Map<string, RecentAddress>();

    [...loadedOperations]
      .filter(
        operation =>
          OUTGOING_OPERATION_TYPES.has(operation.type) &&
          operation.blockHeight != null &&
          !operation.hasFailed,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .forEach(operation => {
        operation.recipients.forEach(recipient => {
          const normalizedRecipient = recipient.trim().toLowerCase();

          if (!normalizedRecipient || deduplicatedAddresses.has(normalizedRecipient)) {
            return;
          }

          const matchedAccount = userAccountsByAddress.get(normalizedRecipient);
          const trimmedRecipient = recipient.trim();
          deduplicatedAddresses.set(normalizedRecipient, {
            address: trimmedRecipient,
            currency,
            lastUsedAt: operation.date,
            name: trimmedRecipient,
            isLedgerAccount: !!matchedAccount,
            accountId: matchedAccount?.id,
          });
        });
      });

    return Array.from(deduplicatedAddresses.values());
  }, [account?.operations, currency, userAccountsForCurrency]);

  const matchedRecentAddress = useMemo(() => {
    if (!canMatchValidatedRecipient) return undefined;

    const normalizedRecipientAddress = addressForBridgeValidation.toLowerCase();

    return recentSendRecipients.find(
      (recent: RecentAddress) => recent.address.toLowerCase() === normalizedRecipientAddress,
    );
  }, [recentSendRecipients, canMatchValidatedRecipient, addressForBridgeValidation]);

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
    mainAccount,
    currency,
    addressForBridgeValidation,
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
