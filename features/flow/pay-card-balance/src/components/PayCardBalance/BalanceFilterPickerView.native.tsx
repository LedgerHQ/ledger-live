import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Banner,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Bundle } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { BalanceFilterPickerViewProps } from "./types";

export function BalanceFilterPickerView({
  isOpen,
  draftFilter,
  options,
  labels,
  onClose,
  onSelectDraft,
  onConfirm,
}: BalanceFilterPickerViewProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      testID="pay-card-balance-filter-sheet"
    >
      {isOpen ? (
        <>
          <BottomSheetHeader
            spacing
            density="expanded"
            title={labels.filterDialogTitle}
            description={labels.filterDialogDescription}
          />
          {/* Scrollable asset list: only the options scroll, the footer below stays pinned. */}
          <BottomSheetScrollView>
            <Box
              lx={{ flexDirection: "column", gap: "s8", paddingBottom: "s16" }}
              testID="pay-card-balance-filter-picker"
            >
              {options.map(option => {
                const selected = option.id === draftFilter;
                const rowKey = option.ticker?.toLowerCase() ?? "all";
                return (
                  <Card
                    key={option.id}
                    type="interactive"
                    outlined={selected}
                    onPress={() => onSelectDraft(option.id)}
                    testID={`pay-card-balance-filter-option-${rowKey}`}
                  >
                    <CardHeader>
                      <CardLeading>
                        {option.ledgerId != null ? (
                          <CryptoIcon
                            ledgerId={option.ledgerId}
                            ticker={option.ticker ?? ""}
                            size={48}
                          />
                        ) : (
                          <Spot appearance="icon" icon={Bundle} size={48} />
                        )}
                        <CardContent>
                          <CardContentTitle>{option.title}</CardContentTitle>
                          {option.ticker != null ? (
                            <CardContentDescription>{option.ticker}</CardContentDescription>
                          ) : null}
                        </CardContent>
                      </CardLeading>
                      <CardTrailing>
                        <Box lx={{ alignItems: "flex-end" }}>
                          <CardContentTitle>{option.countervalueLabel}</CardContentTitle>
                          {option.cryptoAmountLabel != null ? (
                            <CardContentDescription>
                              {option.cryptoAmountLabel}
                            </CardContentDescription>
                          ) : null}
                        </Box>
                      </CardTrailing>
                    </CardHeader>
                  </Card>
                );
              })}
              <Banner appearance="info" title={labels.filterDialogBanner} />
            </Box>
          </BottomSheetScrollView>
          {/* Pinned footer: always visible regardless of how long the asset list is. */}
          <BottomSheetFooter lx={{ gap: "s16" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              onPress={onConfirm}
              accessibilityLabel={labels.confirm}
              testID="pay-card-balance-filter-confirm"
            >
              {labels.confirm}
            </Button>
          </BottomSheetFooter>
        </>
      ) : null}
    </QueuedBottomSheet>
  );
}
