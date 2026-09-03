import React from "react";
import { log } from "@ledgerhq/logs";
import { Linking } from "react-native";
import { Box, Button, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { SwapTransactionStatusOrigin } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import { useFooterSectionViewModel } from "../../hooks/useFooterSectionViewModel";

type FooterSectionProps = Readonly<{
  explorerUrl?: string;
  isLoading: boolean;
  origin?: SwapTransactionStatusOrigin;
  onReturn?: () => void;
}>;

type ExplorerButtonProps = Readonly<{
  explorerUrl?: string;
  isLoading: boolean;
  label: string;
}>;

function ExplorerButton({ explorerUrl, isLoading, label }: ExplorerButtonProps) {
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
      {label}
    </Button>
  );
}

export function FooterSection({ explorerUrl, isLoading, origin, onReturn }: FooterSectionProps) {
  const { viewInExplorerLabel, returnToPerpsLabel } = useFooterSectionViewModel();

  return (
    <Box lx={{ gap: "s8" }}>
      {origin === "perps" && onReturn ? (
        <Button
          testID="swap-transaction-return-btn"
          appearance="base"
          size="md"
          lx={{ width: "full" }}
          onPress={onReturn}
        >
          {returnToPerpsLabel}
        </Button>
      ) : null}

      <ExplorerButton explorerUrl={explorerUrl} isLoading={isLoading} label={viewInExplorerLabel} />
    </Box>
  );
}
