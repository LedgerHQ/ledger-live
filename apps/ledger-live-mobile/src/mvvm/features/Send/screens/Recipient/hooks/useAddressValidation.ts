import { isAddressSanctioned } from "@ledgerhq/ledger-wallet-framework/sanction/index";
import { useDomain } from "@ledgerhq/domain-service/hooks/index";
import { isLoaded } from "@ledgerhq/domain-service/hooks/logic";
import type { DomainServiceStatus } from "@ledgerhq/domain-service/hooks/types";
import { InvalidAddress, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo, useRef, useState } from "react";

import { useBridgeRecipientValidation } from "@ledgerhq/live-common/flows/send/recipient/hooks/useBridgeRecipientValidation";
import type {
  AddressSearchResult,
  AddressValidationError,
  AddressValidationStatus,
  BridgeValidationErrors,
} from "@ledgerhq/live-common/flows/send/recipient/types";

function isDomainLoading(domain: DomainServiceStatus): boolean {
  return domain.status === "loading" || domain.status === "queued";
}

type UseAddressValidationProps = Readonly<{
  searchValue: string;
  currency: CryptoCurrency | TokenCurrency;
  account?: AccountLike;
  parentAccount?: Account | null;
  currentAccountId?: string;
  recipientSupportsDomain?: boolean;
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
  recipientSupportsDomain = false,
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

  const lastSearchValueRef = useRef<string>("");
  const validationTriggeredRef = useRef<boolean>(false);

  const domainServiceResponse = useDomain(recipientSupportsDomain ? searchValue : "", "ens");
  const domainIsLoading = recipientSupportsDomain && isDomainLoading(domainServiceResponse);

  const ensResolution = useMemo(() => {
    if (!recipientSupportsDomain) return null;
    if (isLoaded(domainServiceResponse) && domainServiceResponse.resolutions.length > 0) {
      return domainServiceResponse.resolutions[0];
    }
    return null;
  }, [domainServiceResponse, recipientSupportsDomain]);

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
      addressForBridgeValidation &&
      account &&
      (!recipientSupportsDomain || ensResolution || !domainIsLoading),
    ),
    debounceMs,
  });

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
      resolvedAddress: ensResolution?.address,
      ensName: ensResolution?.domain,
      isLedgerAccount: false,
      accountName: undefined,
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: undefined,
      matchedAccounts: [],
      bridgeErrors: filteredBridgeErrors,
      bridgeWarnings: bridgeValidation.warnings,
    };
  }, [
    validationState,
    ensResolution,
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
