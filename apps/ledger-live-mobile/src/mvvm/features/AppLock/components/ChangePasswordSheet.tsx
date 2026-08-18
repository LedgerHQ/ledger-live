import { BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Lock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "LLM/components/InfoState";
import React from "react";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  onConfirm: () => void;
  onHidden: () => void;
}>;

export function ChangePasswordSheet({ isOpen, onConfirm, onHidden }: Props): React.JSX.Element {
  return (
    <QueuedBottomSheet
      isForcingToBeOpened={isOpen}
      noCloseButton
      preventBackdropClick
      enableDynamicSizing
      onModalHide={onHidden}
      testID="app-lock-change-password-sheet"
    >
      <BottomSheetView>
        <ChangePasswordContent onConfirm={onConfirm} />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}

function ChangePasswordContent({ onConfirm }: Pick<Props, "onConfirm">): React.JSX.Element {
  const { t } = useTranslation();

  useBottomSheetBackgroundTone("info");

  return (
    <InfoState
      size="hug"
      preset="spot"
      spotProps={{ icon: Lock }}
      title={t("appLock.longerPassword.prompt.title")}
      description={t("appLock.longerPassword.prompt.description")}
      primaryCta={{
        label: t("appLock.longerPassword.prompt.cta"),
        onPress: onConfirm,
        testID: "app-lock-change-password-confirm",
      }}
    />
  );
}
