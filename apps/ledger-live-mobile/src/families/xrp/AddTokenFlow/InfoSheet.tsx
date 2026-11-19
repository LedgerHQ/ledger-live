import React from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import type { InfoRow } from "./useReviewViewModel";

type Props = Readonly<{ row: InfoRow | undefined; onClose: () => void }>;

function SheetContent(props: Readonly<{ row: InfoRow | undefined }>) {
  const { t } = useTranslation();
  const bottomInset = useBottomSheetBottomInset();

  const content = {
    tokenType: {
      title: t("xrp.addToken.steps.review.tokenType"),
      text: t("xrp.manageAssets.tokenTypeInfo"),
    },
    transferFee: {
      title: t("xrp.manageAssets.transferFee"),
      text: t("xrp.manageAssets.transferFeeInfo"),
    },
    lockedAmount: {
      title: t("xrp.manageAssets.lockedAmount"),
      text: t("xrp.addToken.steps.review.lockedAmountInfo"),
    },
    rippling: {
      title: t("xrp.rippling.label"),
      text: t("xrp.manageAssets.ripplingInfo"),
    },
  };
  const shown = props.row ? content[props.row] : undefined;

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset }}>
      <BottomSheetHeader title={shown?.title} description={shown?.text} />
    </BottomSheetView>
  );
}

export function InfoSheet({ row, onClose }: Props) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={!!row}
      onClose={onClose}
      enableDynamicSizing
      testID="xrp-info-sheet"
    >
      <SheetContent row={row} />
    </QueuedBottomSheet>
  );
}
