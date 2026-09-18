import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import type { DomainServiceStatus } from "@ledgerhq/domain-service/hooks/types";
import { InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/ledger-wallet-framework/errors";
import { selectContacts } from "@domain/entity-contact";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
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
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useMemo, useRef, useState } from "react";
import { t } from "~/renderer/i18n/init";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useLLDCoinFamily } from "~/renderer/families";
import { getAccountSelfTransferTarget } from "../../../utils/selfTransferTarget";
import { useFormattedAccountBalance } from "./useFormattedAccountBalance";

function isDomainLoading(domain: DomainServiceStatus): boolean {
  return domain.status === "loading" || domain.status === "queued";
}

const OUTGOING_OPERATION_TYPES = new Set<Operation["type"]>(["OUT"]);
const MAX_RECENT_RECIPIENTS = 12;

function isConfirmedOutgoingOperation(operation: Operation): boolean {
  return (
    OUTGOING_OPERATION_TYPES.has(operation.type) &&
    operation.blockHeight != null &&
    !operation.hasFailed
  );
}

function tryAddRecentRecipient(
  operation: Operation,
  recipient: string,
  deduplicatedAddresses: Map<string, RecentAddress>,
  userAccountsByAddress: Map<string, AccountLike>,
  currency: CryptoCurrency | TokenCurrency,
): void {
  const normalizedRecipient = recipient.trim().toLowerCase();
  if (!normalizedRecipient) return;

  const existing = deduplicatedAddresses.get(normalizedRecipient);
  const isNewer = !existing || operation.date.getTime() > existing.lastUsedAt.getTime();
  if (!isNewer) return;

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
}

type UseAddressValidationProps = Readonly<{
  searchValue: string;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  transaction?: Transaction | null;
  currentAccountId?: string;
  recipientSupportsDomain?: boolean;
  canSearchContactsByName?: boolean;
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

  // Every address by which a candidate account can be recognized as the
  // recipient, per the coin-families contract (defaults to the fresh address
  // alone -- see `getAccountRecipientAddresses` on `LLDCoinFamily`).
  const family = useLLDCoinFamily(mainAccount?.currency.family);
  const getRecipientAddresses = useCallback(
    (candidate: Account): string[] =>
      family.getAccountRecipientAddresses?.(candidate) ?? [candidate.freshAddress],
    [family],
  );

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

  const recentSendRecipients = useMemo(() => {
    const loadedOperations = account?.operations ?? [];
    const userAccountsByAddress = new Map(
      userAccountsForCurrency.flatMap(acc =>
        getRecipientAddresses(acc).map(address => [address.toLowerCase(), acc] as const),
      ),
    );

    const deduplicatedAddresses = new Map<string, RecentAddress>();

    for (const operation of loadedOperations) {
      if (!isConfirmedOutgoingOperation(operation)) continue;

      for (const recipient of operation.recipients) {
        if (deduplicatedAddresses.size >= MAX_RECENT_RECIPIENTS) break;
        tryAddRecentRecipient(
          operation,
          recipient,
          deduplicatedAddresses,
          userAccountsByAddress,
          currency,
        );
      }

      if (deduplicatedAddresses.size >= MAX_RECENT_RECIPIENTS) break;
    }

    return Array.from(deduplicatedAddresses.values()).sort(
      (a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime(),
    );
  }, [account?.operations, currency, userAccountsForCurrency, getRecipientAddresses]);

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
    return userAccountsForCurrency.filter(acc =>
      getRecipientAddresses(acc).some(
        address => address.toLowerCase() === normalizedRecipientAddress,
      ),
    );
  }, [
    canMatchValidatedRecipient,
    userAccountsForCurrency,
    addressForBridgeValidation,
    getRecipientAddresses,
  ]);

  const currentAccountMatch = useMemo(() => {
    if (!canMatchValidatedRecipient || !account || !mainAccount) return null;

    const selfTransferPolicy = sendFeatures.getSelfTransferPolicy(currency);
    const normalizedRecipientAddress = addressForBridgeValidation.toLowerCase();
    const addressMatches = getRecipientAddresses(mainAccount).some(
      address => address.toLowerCase() === normalizedRecipientAddress,
    );

    if (addressMatches && (selfTransferPolicy === "free" || selfTransferPolicy === "warning")) {
      return mainAccount;
    }

    return null;
  }, [
    canMatchValidatedRecipient,
    account,
    mainAccount,
    currency,
    addressForBridgeValidation,
    getRecipientAddresses,
  ]);

  const matchedLedgerAccount = currentAccountMatch ?? matchedLedgerAccounts[0];

  const { formattedBalance, formattedCounterValue } =
    useFormattedAccountBalance(matchedLedgerAccount);
  const matchedLedgerAccountName = useMaybeAccountName(matchedLedgerAccount);

  // A pasted address matching the account being sent from is its self-transfer
  // target (the account's other pool): show the pool label ("Private balance")
  // rather than the account's own name, the same label the self-transfer
  // shortcut already produces on click. Any other self-match (e.g. the pool
  // currently being spent from) keeps the account name.
  const selfTransferPoolLabel = useMemo(() => {
    if (!currentAccountMatch) return undefined;
    const target = getAccountSelfTransferTarget(currentAccountMatch, transaction);
    if (!target || target.address.toLowerCase() !== addressForBridgeValidation.toLowerCase()) {
      return undefined;
    }
    return t(`newSendFlow.${target.translationKey}.label`);
  }, [currentAccountMatch, transaction, addressForBridgeValidation]);

  const accountName = selfTransferPoolLabel ?? matchedLedgerAccountName;

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

    const filteredBridgeErrors: BridgeValidationErrors = {
      ...bridgeValidation.errors,
    };
    if (ensResolution && filteredBridgeErrors.recipient?.name === "InvalidAddress") {
      delete filteredBridgeErrors.recipient;
    }

    const isImpossibleSelfTransferAttempt =
      mainAccount &&
      sendFeatures.getSelfTransferPolicy(currency) === "impossible" &&
      getRecipientAddresses(mainAccount).some(
        address => address.toLowerCase() === addressForBridgeValidation.toLowerCase(),
      );

    if (isImpossibleSelfTransferAttempt && !filteredBridgeErrors.recipient) {
      filteredBridgeErrors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    // The address that actually matched, not the account's fresh address: a
    // family can recognize an account by more than its fresh address (see
    // `getRecipientAddresses`), and resolving to the wrong one of those two
    // would silently redirect the send (e.g. a shielded match resolving to the
    // transparent address).
    const matchedAddress = matchedLedgerAccount
      ? getRecipientAddresses(matchedLedgerAccount).find(
          address => address.toLowerCase() === addressForBridgeValidation.toLowerCase(),
        )
      : undefined;

    return {
      status: validationState.status,
      error: validationState.error,
      resolvedAddress: matchedAddress ?? matchedContact?.address ?? ensResolution?.address,
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
    getRecipientAddresses,
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
