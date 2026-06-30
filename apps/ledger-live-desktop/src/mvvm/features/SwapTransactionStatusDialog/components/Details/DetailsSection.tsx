import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { getSwapTransactionStatusDetailsViewModel } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { SquaredCryptoIcon } from "LLD/components/SquaredCryptoIcon";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { openURL } from "~/renderer/linking";
import { CopyIconButton } from "./CopyIconButton";
import { DetailRow } from "./DetailRow";

type DetailsSectionProps = Readonly<{
  feesAmount?: string;
  receiveAccountName?: string;
  receiveAccountCurrency?: CryptoCurrency;
  provider?: string;
  providerData?: AdditionalProviderConfig;
  swapId: string;
}>;

export function DetailsSection({
  feesAmount,
  receiveAccountName,
  receiveAccountCurrency,
  provider,
  providerData,
  swapId,
}: DetailsSectionProps) {
  const { t } = useTranslation();
  const detailsViewModel = getSwapTransactionStatusDetailsViewModel({
    provider,
    providerData,
    swapId,
  });
  const { providerMainUrl, providerName, shouldShowProvider, truncatedSwapId } = detailsViewModel;

  return (
    <section>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-12 gap-y-12">
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.networkFees")}
          value={feesAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
          testId="swap-transaction-details-network-fees"
        />
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.receiveAccount")}
          testId="swap-transaction-details-receive-account"
          value={
            receiveAccountName ? (
              <div className="inline-flex items-center gap-6">
                <span>{receiveAccountName}</span>
                {receiveAccountCurrency ? (
                  <SquaredCryptoIcon
                    ledgerId={receiveAccountCurrency.id}
                    ticker={receiveAccountCurrency.ticker}
                    size={16}
                  />
                ) : null}
              </div>
            ) : (
              <Skeleton className="h-16 rounded-sm" style={{ width: 112 }} />
            )
          }
        />
        {shouldShowProvider && provider ? (
          <DetailRow
            label={t("swap2.modals.transactionStatus.sections.details.provider")}
            value={
              providerMainUrl ? (
                <button
                  type="button"
                  data-testid="swap-transaction-details-provider"
                  className="inline-flex cursor-pointer items-center gap-6 border-0 bg-transparent p-0 body-3 text-base"
                  onClick={() => openURL(providerMainUrl, "SwapTransactionStatus_Provider")}
                >
                  <span>{providerName}</span>
                  <ProviderIcon name={provider} size="XXS" borderRadius={4} />
                </button>
              ) : (
                <div
                  data-testid="swap-transaction-details-provider"
                  className="inline-flex items-center gap-6"
                >
                  <span className="body-3-semi-bold">{providerName}</span>
                  <ProviderIcon name={provider} size="XXS" borderRadius={4} />
                </div>
              )
            }
          />
        ) : null}
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.swapId")}
          value={
            <div className="inline-flex items-center gap-6">
              <span data-testid="swap-transaction-details-swap-id" className="body-3-semi-bold">
                {truncatedSwapId}
              </span>
              <CopyIconButton text={swapId} />
            </div>
          }
        />
      </dl>
    </section>
  );
}
