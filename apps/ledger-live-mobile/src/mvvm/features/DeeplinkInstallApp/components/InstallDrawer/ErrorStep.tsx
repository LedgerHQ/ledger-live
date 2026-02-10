import React from "react";
import { Box, Text, Button } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import TranslatedError from "~/components/TranslatedError";

type Props = Readonly<{
  error: Error | null;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function ErrorStep({ error, onRetry, onCancel }: Props) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "s32",
        paddingBottom: "s12",
      }}
    >
      <Warning size={40} color="error" />
      <Text
        typography="heading5SemiBold"
        lx={{ color: "base", textAlign: "center", marginTop: "s16" }}
      >
        <TranslatedError error={error} />
      </Text>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center", marginTop: "s8" }}>
        <TranslatedError error={error} field="description" />
      </Text>
      <Button
        appearance="base"
        size="lg"
        lx={{ marginTop: "s16", alignSelf: "stretch" }}
        onPress={onRetry}
      >
        {t("common.retry")}
      </Button>
      <Button
        appearance="gray"
        size="lg"
        lx={{ marginTop: "s12", alignSelf: "stretch" }}
        onPress={onCancel}
      >
        {t("common.cancel")}
      </Button>
    </Box>
  );
}
