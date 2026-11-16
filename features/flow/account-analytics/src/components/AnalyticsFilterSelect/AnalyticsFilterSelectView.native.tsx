import React, { useRef, type ReactNode } from "react";
import type { TextInput } from "react-native";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  MediaButton,
  SelectList,
  SelectListContent,
  SelectListEmptyState,
  SelectListSearch,
} from "@ledgerhq/lumen-ui-rnative";
import { CoinsCrypto, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import { AnalyticsFilterItem } from "../AnalyticsFilterItem/AnalyticsFilterItem";
import type { AnalyticsFilterOptionMeta } from "../AnalyticsFilters/AnalyticsFiltersView.types";
import { ANALYTICS_FILTER_VARIANTS } from "./analyticsFilterVariants";
import type { AnalyticsFilterSelectProps } from "./AnalyticsFilterSelect.types";
import { matchAnalyticsFilterOption } from "./matchAnalyticsFilterOption";
import type { AnalyticsFilterSelectViewModel } from "./useAnalyticsFilterSelectViewModel";

type AnalyticsFilterSelectViewProps = Omit<
  AnalyticsFilterSelectProps,
  "onOpenChange" | "onValueChange"
> &
  Readonly<{ sheet: AnalyticsFilterSelectViewModel }>;

const FALLBACK_ICONS = { asset: CoinsCrypto, account: Wallet } as const;

/**
 * Lives inside the sheet: the keyboard hook registers the field with the enclosing gorhom sheet,
 * and the field stays pinned above the scrolling list so the keyboard never covers it.
 */
function SearchableSheetContent({
  testId,
  placeholder,
  noResultsTitle,
  children,
}: Readonly<{ testId: string; placeholder: string; noResultsTitle: string; children: ReactNode }>) {
  const inputRef = useRef<TextInput>(null);
  const keyboardAwareInputProps = useBottomSheetKeyboardAwareInput(inputRef);
  const bottomInset = useBottomSheetBottomInset();
  return (
    <>
      {/* Same side padding as Lumen's sheet scrollables, which the list below gets on its own. */}
      <Box lx={{ paddingHorizontal: "s16" }}>
        <BottomSheetHeader />
        <Box lx={{ paddingRight: "s8" }}>
          <SelectListSearch
            ref={inputRef}
            testID={`${testId}-search`}
            placeholder={placeholder}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            {...keyboardAwareInputProps}
          />
        </Box>
      </Box>
      <BottomSheetScrollView
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: bottomInset }}
      >
        {children}
        <SelectListEmptyState
          testID={`${testId}-no-results`}
          title={noResultsTitle}
          lx={{ paddingRight: "s8" }}
        />
      </BottomSheetScrollView>
    </>
  );
}

export function AnalyticsFilterSelectView({
  variant,
  ariaLabel,
  items,
  value,
  triggerLabel,
  selectedMeta,
  disabled,
  sheet,
}: AnalyticsFilterSelectViewProps) {
  const { testId, iconShape, searchable } = ANALYTICS_FILTER_VARIANTS[variant];
  const FallbackIcon = FALLBACK_ICONS[variant];
  const renderIcon = (meta: AnalyticsFilterOptionMeta) => (
    <CryptoIcon ledgerId={meta.iconId} ticker={meta.ticker} size={24} shape={iconShape} />
  );
  const options = (
    <SelectListContent
      lx={{ paddingRight: "s8", paddingBottom: "s24" }}
      renderItem={item => {
        const meta = items.find(option => option.value === item.value)?.meta;
        return (
          <AnalyticsFilterItem
            key={item.value}
            value={item.value}
            label={item.label}
            description={meta?.networkName}
            icon={meta ? renderIcon(meta) : <FallbackIcon size={24} />}
            testID={`${testId}-option-${item.value || "all"}`}
          />
        );
      }}
    />
  );
  return (
    <>
      <MediaButton
        appearance="gray"
        size="sm"
        accessibilityLabel={ariaLabel}
        testID={testId}
        disabled={disabled}
        leadingContentShape="rounded"
        leadingContent={selectedMeta ? renderIcon(selectedMeta) : undefined}
        onPress={sheet.open}
      >
        {triggerLabel}
      </MediaButton>
      {searchable ? (
        <QueuedBottomSheet
          testID={`${testId}-sheet`}
          isRequestingToBeOpened={sheet.isOpen}
          snapPoints="fullWithOffset"
          enableBlurKeyboardOnGesture
          onClose={sheet.close}
        >
          <SelectList
            items={items}
            value={value}
            onValueChange={sheet.selectOption}
            filter={matchAnalyticsFilterOption}
            searchValue={sheet.searchValue}
            onSearchValueChange={sheet.setSearchValue}
          >
            <SearchableSheetContent
              testId={testId}
              placeholder={sheet.searchPlaceholder}
              noResultsTitle={sheet.noResultsTitle}
            >
              {options}
            </SearchableSheetContent>
          </SelectList>
        </QueuedBottomSheet>
      ) : (
        <QueuedBottomSheet
          testID={`${testId}-sheet`}
          isRequestingToBeOpened={sheet.isOpen}
          enableDynamicSizing
          maxDynamicContentSize="fullWithOffset"
          onClose={sheet.close}
        >
          <BottomSheetScrollView stickyHeaderIndices={[0]} alwaysBounceVertical={false}>
            <Box lx={{ backgroundColor: "canvasSheet" }}>
              <BottomSheetHeader />
            </Box>
            <SelectList items={items} value={value} onValueChange={sheet.selectOption}>
              {options}
            </SelectList>
          </BottomSheetScrollView>
        </QueuedBottomSheet>
      )}
    </>
  );
}
