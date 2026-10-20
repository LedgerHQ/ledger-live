import React from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import PageHeader from "LLD/components/PageHeader";
import type { HeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ viewModel: HeaderViewModel }>;

export function HeaderView({ viewModel }: Props) {
  const { t } = useTranslation();
  const { title, address, ledgerId, ticker, onBack, onOpenSettings } = viewModel;
  const settingsLabel = t("accountDetail.header.settings");

  return (
    <PageHeader
      title={title}
      onBack={onBack}
      className="sticky top-0 z-20 bg-canvas pb-12"
      extra={
        <span className="flex items-center gap-4">
          <span data-testid="account-detail-header-address">{address}</span>
          <SquaredCryptoIcon ledgerId={ledgerId} ticker={ticker} size={24} />
        </span>
      }
      trailing={
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              appearance="transparent"
              size="sm"
              icon={Settings}
              aria-label={settingsLabel}
              onClick={onOpenSettings}
              data-testid="account-detail-header-settings"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">{settingsLabel}</TooltipContent>
        </Tooltip>
      }
    />
  );
}
