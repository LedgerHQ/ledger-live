import React from "react";
import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";
import { Box, Button, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useFooterSectionViewModel } from "../../hooks/useFooterSectionViewModel";

type FooterSectionProps = Readonly<{
  explorerUrl?: string;
  isLoading: boolean;
}>;

export function FooterSection({ explorerUrl, isLoading }: FooterSectionProps) {
  const { viewInExplorerLabel } = useFooterSectionViewModel();

  if (isLoading) {
    return <Skeleton lx={{ height: "s40", width: "full" }} />;
  }

  if (!explorerUrl) {
    return <Box lx={{ height: "s40" }} />;
  }

  return (
    <Button
      testID="swap-transaction-view-explorer-btn"
      appearance="transparent"
      size="md"
      icon={ExternalLink}
      lx={{ width: "full" }}
      onPress={() =>
        Linking.openURL(explorerUrl).catch(error => {
          log("swap-transaction-status", "Failed to open explorer URL", {
            error,
            url: explorerUrl,
          });
        })
      }
    >
      {viewInExplorerLabel}
    </Button>
  );
}
