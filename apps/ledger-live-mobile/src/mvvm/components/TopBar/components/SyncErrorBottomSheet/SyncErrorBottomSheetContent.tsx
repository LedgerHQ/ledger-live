import React from "react";
import { Text, Button, Spot, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export type SyncErrorBottomSheetContentProps = {
  onClose: () => void;
  listOfErrorAccountNames: string;
  onTryRefresh: () => void;
};

export function SyncErrorBottomSheetContent({
  onClose,
  listOfErrorAccountNames,
  onTryRefresh,
}: Readonly<SyncErrorBottomSheetContentProps>) {
  const { t } = useTranslation();

  return (
    <>
      <Box lx={{ alignItems: "center", gap: "s24", marginBottom: "s32" }}>
        <Spot size={72} appearance="warning" />
        <Box lx={{ alignItems: "center" }}>
          <Text lx={{ marginBottom: "s12", color: "base" }} typography="heading4">
            {t("syncIndicator.bottomSheet.title")}
          </Text>
          {listOfErrorAccountNames.length > 0 && (
            <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
              {t("syncIndicator.bottomSheet.description", {
                accounts: listOfErrorAccountNames,
              })}
            </Text>
          )}
        </Box>
      </Box>
      <Box lx={{ gap: "s16" }}>
        <Button appearance="base" size="lg" onPress={onTryRefresh}>
          {t("syncIndicator.bottomSheet.tryToRefresh")}
        </Button>
        <Button appearance="transparent" size="lg" onPress={onClose}>
          {t("syncIndicator.bottomSheet.close")}
        </Button>
      </Box>
    </>
  );
}
