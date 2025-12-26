import { AddressInput, Link, useTheme } from "@ledgerhq/lumen-ui-react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AddressSearchResult, AddressValidationError, RecentAddress } from "../types";
import { AddressMatchedSection } from "./AddressMatchedSection";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import MemoInputFactory from "./MemoInputFactory";
import { MyAccountsSection } from "./MyAccountsSection";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { ValidationBanner } from "./ValidationBanner";

type Memo = {
  value: string;
  type?: string;
};

type RecipientAddressModalViewProps = Readonly<{
  searchValue: string;
  isLoading: boolean;
  result: AddressSearchResult;
  recentAddresses: RecentAddress[];
  mainAccount: Account;
  currency: CryptoCurrency | TokenCurrency;
  recipientSupportsDomain: boolean;
  showInitialState: boolean;
  showInitialEmptyState: boolean;
  showMatchedAddress: boolean;
  showAddressValidationError: boolean;
  showEmptyState: boolean;
  showBridgeSenderError: boolean;
  showSanctionedBanner: boolean;
  showBridgeRecipientError: boolean;
  showBridgeRecipientWarning: boolean;
  isSanctioned: boolean;
  isAddressComplete: boolean;
  addressValidationErrorType: AddressValidationError | null;
  bridgeRecipientError: Error | undefined;
  bridgeRecipientWarning: Error | undefined;
  bridgeSenderError: Error | undefined;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onRecentAddressSelect: (address: RecentAddress) => void;
  onAccountSelect: (account: Account) => void;
  onAddressSelect: (address: string, ensName?: string) => void;
  onRemoveAddress: (address: RecentAddress) => void;
  hasMemo: boolean;
}>;

export function RecipientAddressModalView({
  searchValue,
  isLoading,
  result,
  recentAddresses,
  mainAccount,
  currency,
  recipientSupportsDomain,
  showInitialState,
  showInitialEmptyState,
  showMatchedAddress,
  showAddressValidationError,
  showEmptyState,
  showBridgeSenderError,
  showSanctionedBanner,
  showBridgeRecipientError,
  showBridgeRecipientWarning,
  isSanctioned,
  isAddressComplete,
  addressValidationErrorType,
  bridgeRecipientError,
  bridgeRecipientWarning,
  bridgeSenderError,
  onSearchChange,
  onClearSearch,
  onRecentAddressSelect,
  onAccountSelect,
  onAddressSelect,
  onRemoveAddress,
  hasMemo,
}: RecipientAddressModalViewProps) {
  const { t } = useTranslation();
  const { mode } = useTheme();

  const [addressInputValue, setAddressInputValue] = useState("");
  const [isAddressFromSelection, setIsAddressFromSelection] = useState(false);
  const [_memo, setMemo] = useState<Memo>({ value: "" });

  const onAddressInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isAddressFromSelection) {
        setIsAddressFromSelection(false);
      } else {
        onSearchChange(e);
      }
    },
    [isAddressFromSelection, onSearchChange],
  );

  const onAddressInputClear = useCallback(() => {
    setAddressInputValue("");
    onClearSearch();
  }, [onClearSearch]);

  const handleRecentAddressSelect = useCallback(
    (address: RecentAddress) => {
      setIsAddressFromSelection(true);
      setAddressInputValue(address.ensName ?? address.address);
      onRecentAddressSelect(address);
    },
    [onRecentAddressSelect],
  );

  const handleAccountSelect = useCallback(
    (selectedAccount: Account) => {
      setIsAddressFromSelection(true);
      setAddressInputValue(selectedAccount.freshAddress);
      onAccountSelect(selectedAccount);
    },
    [onAccountSelect],
  );

  const handleAddressSelect = useCallback(
    (address: string, ensName?: string) => {
      setIsAddressFromSelection(true);
      setAddressInputValue(ensName ?? address);
      onAddressSelect(address, ensName);
    },
    [onAddressSelect],
  );

  const onMemoInputChange = useCallback(
    (value: string, type?: string) => {
      setMemo({ value, type });
    },
    [setMemo],
  );

  return (
    <div
      className={`flex h-full min-h-0 flex-col ${mode} text-base`}
      data-testid="recipient-address-modal-content"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-24 pt-24">
        <div className="px-24">
          <AddressInput
            value={addressInputValue}
            onChange={onAddressInputChange}
            onClear={onAddressInputClear}
            placeholder={
              recipientSupportsDomain
                ? t("newSendFlow.placeholder")
                : t("newSendFlow.placeholderNoENS")
            }
            className="w-full"
          />

          {isAddressFromSelection && hasMemo && (
            <>
              <div className="mt-12">
                <MemoInputFactory currency={currency} onChange={onMemoInputChange} />
              </div>

              <div className="mt-16">
                <span style={{ fontSize: 14 }}>
                  {t("newSendFlow.skipMemo.notRequired", {
                    memoLabel: t("families." + currency.id + ".memo", "common.memo"),
                  })}
                  &nbsp;
                </span>
                <Link underline appearance="accent" size="sm">
                  {t("common.skip")}
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-24 pb-24">
            {isLoading && (
              <div className="px-16">
                <LoadingState />
              </div>
            )}

            {!isAddressFromSelection && showInitialState && (
              <>
                <RecentAddressesSection
                  recentAddresses={recentAddresses}
                  onSelect={handleRecentAddressSelect}
                  onRemove={onRemoveAddress}
                />
                <MyAccountsSection
                  currency={currency}
                  currentAccountId={mainAccount.id}
                  onSelect={handleAccountSelect}
                />
              </>
            )}

            {showMatchedAddress && (
              <AddressMatchedSection
                searchResult={result}
                searchValue={searchValue}
                onSelect={handleAddressSelect}
                isSanctioned={isSanctioned}
                isAddressComplete={isAddressComplete}
              />
            )}

            {showAddressValidationError && (
              <div className="px-24">
                <EmptyList error={addressValidationErrorType} />
              </div>
            )}

            {(showEmptyState || showInitialEmptyState) && (
              <div className="px-24">
                <EmptyList translationKey="newSendFlow.recentSendWillAppear" />
              </div>
            )}

            {(showBridgeSenderError ||
              showSanctionedBanner ||
              showBridgeRecipientError ||
              showBridgeRecipientWarning) && (
              <div className="flex flex-col gap-16 px-24 pt-16">
                {showBridgeSenderError && (
                  <ValidationBanner type="error" error={bridgeSenderError} variant="sender" />
                )}
                {showSanctionedBanner && <ValidationBanner type="sanctioned" />}
                {showBridgeRecipientError && (
                  <ValidationBanner
                    type="error"
                    error={bridgeRecipientError}
                    variant="recipient"
                    excludeRecipientRequired
                  />
                )}
                {showBridgeRecipientWarning && (
                  <ValidationBanner
                    type="warning"
                    warning={bridgeRecipientWarning}
                    variant="recipient"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
