import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Settings } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../testIds";

type Props = Readonly<{ onPress: () => void }>;

export function AccountDetailSettingsButton({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={Settings}
      accessibilityLabel={t("settings.title")}
      onPress={onPress}
      testID={ACCOUNT_DETAIL_TEST_IDS.settingsButton}
    />
  );
}
