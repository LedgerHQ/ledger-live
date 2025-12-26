import React, { useCallback, useMemo, useState } from "react";
import {
  AddressInput,
  Banner,
  Button,
  Checkbox,
  Link,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AddressSearchResult, AddressValidationError, RecentAddress } from "../types";
import { AddressMatchedSection } from "./AddressMatchedSection";
import EmptyList from "./EmptyList";
import { LoadingState } from "./LoadingState";
import { MyAccountsSection } from "./MyAccountsSection";
import { RecentAddressesSection } from "./RecentAddressesSection";
import { ValidationBanner } from "./ValidationBanner";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { Memo } from "../../../types";

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
  memoType?: string;
  memoTypeOptions?: readonly string[];
  memoDefaultOption?: string;
  memoMaxLength?: number;
  onMemoChange: (memo: Memo) => void;
  onMemoSkip: () => void;
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
  memoType,
  memoTypeOptions,
  memoDefaultOption,
  memoMaxLength,
  onMemoChange,
  onMemoSkip,
}: RecipientAddressModalViewProps) {
  const { t } = useTranslation();

  const [memo, setMemo] = useState<Memo>({
    value: "",
    type: memoDefaultOption,
  });

  const onMemoValueChange = useCallback(
    (value: string) => {
      const newMemo = { ...memo, value };
      setMemo(newMemo);
      onMemoChange(newMemo);
    },
    [memo, onMemoChange],
  );

  const onMemoTypeChange = useCallback(
    (type: string) => {
      const newMemo = { value: "", type };
      setMemo(newMemo);
      onMemoChange(newMemo);
    },
    [onMemoChange],
  );

  const showSkipMemo = useMemo(() => {
    const noMemoWithoutType = !memo.type && memo.value.length === 0;
    const noMemoWithType = memo.type && memo.type !== "NO_MEMO" && memo.value.length === 0;
    return noMemoWithoutType || noMemoWithType;
  }, [memo.type, memo.value.length]);

  const [skipMemoState, setSkipMemoState] = useState<"propose" | "toConfirm">("propose");

  const showMemoValueInput = useMemo(() => {
    return memo.type !== "NO_MEMO";
  }, [memo]);

  const hasMemoTypeOptions = useMemo(() => {
    return memoType == "typed" && memoTypeOptions;
  }, [memoType, memoTypeOptions]);

  const hasFilledMemo = useMemo(() => {
    return hasMemo && (memo.value.length > 0 || memo.type === "NO_MEMO");
  }, [hasMemo, memo.type, memo.value.length]);

  return (
    <>
      <div className="mb-24 w-full">
        <AddressInput
          value={searchValue}
          onChange={onSearchChange}
          onClear={onClearSearch}
          placeholder={
            recipientSupportsDomain
              ? t("newSendFlow.placeholder")
              : t("newSendFlow.placeholderNoENS")
          }
          className="px-24"
        />

        {showMatchedAddress && hasMemo && (
          <>
            <div className="mt-12 px-24">
              {hasMemoTypeOptions && (
                <Select onValueChange={onMemoTypeChange} value={memo.type}>
                  <SelectTrigger />
                  <SelectContent>
                    {memoTypeOptions!.map((value, key) => {
                      return (
                        <SelectItem key={key} value={value}>
                          <SelectItemText>
                            {t("families." + currency.id + ".memoType." + value)}
                          </SelectItemText>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}

              {showMemoValueInput && (
                <TextInput
                  label={t("newSendFlow.tagHelp.inputLabel", {
                    memoLabel: t(["families." + currency.id + ".memo", "common.memo"]),
                  })}
                  onChange={e => onMemoValueChange(e.target.value)}
                  suffix={
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Information className="text-muted" size={20} />
                      </TooltipTrigger>
                      <TooltipContent className="w-256">
                        {t("newSendFlow.tagHelp.description", {
                          currency: currency.id,
                          memoLabel: t(["families." + currency.id + ".memo", "common.memo"]),
                        })}
                      </TooltipContent>
                    </Tooltip>
                  }
                  className="mt-12 w-full"
                  value={memo.value}
                  maxLength={memoMaxLength}
                  errorMessage={
                    result.bridgeErrors?.transaction
                      ? t("errors." + result.bridgeErrors?.transaction.name + ".title")
                      : undefined
                  }
                />
              )}
            </div>

            {showSkipMemo && (
              <>
                <div className="px-24">
                  {skipMemoState === "propose" && (
                    <div className="mt-16">
                      <span style={{ fontSize: 14 }}>
                        {t("newSendFlow.skipMemo.notRequired", {
                          memoLabel: t(["families." + currency.id + ".memo", "common.memo"]),
                        })}
                        &nbsp;
                      </span>
                      <Link
                        underline
                        appearance="accent"
                        size="sm"
                        onClick={() => setSkipMemoState("toConfirm")}
                      >
                        {t("common.skip")}
                      </Link>
                    </div>
                  )}

                  {skipMemoState === "toConfirm" && (
                    <div className="mt-16">
                      <Banner
                        appearance="warning"
                        title={t("newSendFlow.skipMemo.title", {
                          memoLabel: t(["families." + currency.id + ".memo", "common.memo"]),
                        })}
                        description={t("newSendFlow.skipMemo.description", {
                          memoLabel: t(["families." + currency.id + ".memo", "common.memo"]),
                        })}
                        closeAriaLabel="Close banner"
                        primaryAction={
                          <Button appearance="transparent" size="sm" onClick={onMemoSkip}>
                            {t("newSendFlow.skipMemo.confirm")}
                          </Button>
                        }
                      />
                      <div>
                        <Checkbox />
                        <span>{t("newSendFlow.skipMemo.neverAskAgain")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {isLoading && (
          <div className="px-16">
            <LoadingState />
          </div>
        )}

        {showInitialState && (
          <>
            <RecentAddressesSection
              recentAddresses={recentAddresses}
              onSelect={onRecentAddressSelect}
              onRemove={onRemoveAddress}
            />
            <MyAccountsSection
              currency={currency}
              currentAccountId={mainAccount.id}
              onSelect={onAccountSelect}
            />
          </>
        )}

        {showMatchedAddress && (!hasMemo || hasFilledMemo) && (
          <AddressMatchedSection
            searchResult={result}
            searchValue={searchValue}
            onSelect={onAddressSelect}
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
    </>
  );
}
