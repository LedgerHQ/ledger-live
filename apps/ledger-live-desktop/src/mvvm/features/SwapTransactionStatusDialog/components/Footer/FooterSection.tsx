import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Skeleton } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { openURL } from "~/renderer/linking";

type FooterSectionProps = Readonly<{
  explorerUrl?: string;
  isLoading: boolean;
}>;

export function FooterSection({ explorerUrl, isLoading }: FooterSectionProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-sm" />;
  }

  if (!explorerUrl) {
    return <div className="h-40" aria-hidden />;
  }

  return (
    <div className="pb-4">
      <Button
        appearance="transparent"
        isFull
        size="md"
        icon={ExternalLink}
        data-testid="swap-transaction-view-explorer-btn"
        data-href={explorerUrl}
        onClick={() => openURL(explorerUrl, "SwapTransactionStatus_ViewExplorer")}
      >
        {t("swap2.modals.transactionStatus.actions.viewInExplorer")}
      </Button>
    </div>
  );
}
