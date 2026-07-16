import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  onPress: () => void;
}>;

export function OperationsHistoryOptionsTrailing({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={MoreVertical}
      accessibilityLabel={t("operationsList.options.more")}
      onPress={onPress}
      testID="operations-history-options-trigger"
    />
  );
}
