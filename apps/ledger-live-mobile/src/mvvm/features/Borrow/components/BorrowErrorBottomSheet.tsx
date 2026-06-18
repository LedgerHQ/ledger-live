import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { InfoState } from "LLM/components/InfoState";
import { useSelector } from "~/context/hooks";
import { borrowErrorBottomSheetSelector } from "~/reducers/borrow";
import { resolveBorrowErrorBottomSheet } from "LLM/features/Borrow/handlers/borrowErrorBottomSheetStore";

/**
 * Renders the bottom sheet opened by the Borrow live app via the
 * `custom.bottomSheet.error` wallet-api method.
 *
 * The sheet uses the shared `InfoState` with `preset="error"`, which both
 * renders the error visual + title + description + CTA and tints the parent
 * bottom sheet with the error gradient via `useBottomSheetBackgroundTone`.
 *
 * The wallet-api promise always resolves with `{ confirmed: boolean }`:
 * `true` when the CTA is pressed, `false` when the sheet is closed or dragged
 * down.
 */
export function BorrowErrorBottomSheet() {
  const insets = useSafeAreaInsets();
  const data = useSelector(borrowErrorBottomSheetSelector);
  const isRequestingToBeOpened = !!data;

  // Tracks whether the wallet-api promise has already been settled for the
  // currently displayed sheet so that follow-up close events (e.g. the dismiss
  // animation completing after a CTA press) don't override the outcome.
  const settledRef = useRef(false);
  const activeDataRef = useRef(data);

  useEffect(() => {
    activeDataRef.current = data;

    if (data) {
      settledRef.current = false;
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (activeDataRef.current && !settledRef.current) {
        settledRef.current = true;
        resolveBorrowErrorBottomSheet(false);
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    if (!settledRef.current) {
      settledRef.current = true;
      resolveBorrowErrorBottomSheet(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!settledRef.current) {
      settledRef.current = true;
      resolveBorrowErrorBottomSheet(true);
    }
  }, []);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={handleClose}
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader />
        {data ? (
          <InfoState
            preset="error"
            size="hug"
            title={data.title}
            description={data.description}
            primaryCta={{
              label: data.ctaLabel,
              onPress: handleConfirm,
              testID: "borrow-error-bottom-sheet-cta",
            }}
            testID="borrow-error-bottom-sheet"
          />
        ) : null}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
}
