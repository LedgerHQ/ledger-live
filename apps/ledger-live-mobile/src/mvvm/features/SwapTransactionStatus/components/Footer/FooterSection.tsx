import React from "react";
import { Linking } from "react-native";
import { Box, Button, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type FooterSectionProps = Readonly<{
  explorerUrl?: string;
  isLoading: boolean;
}>;

export function FooterSection({ explorerUrl, isLoading }: FooterSectionProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Skeleton lx={{ height: "s40", width: "full" }} />;
  }

  if (!explorerUrl) {
    return <Box lx={{ height: "s40" }} />;
  }

  return (
    <Button
      appearance="transparent"
      size="md"
      icon={ExternalLink}
      lx={{ width: "full" }}
      onPress={() => Linking.openURL(explorerUrl).catch(() => {})}
    >
      {t("transfer.swap2.modals.transactionStatus.actions.viewInExplorer")}
    </Button>
  );
}
