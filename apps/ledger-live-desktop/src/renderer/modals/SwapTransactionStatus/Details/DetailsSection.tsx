import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { AdditionalProviderConfig } from "@ledgerhq/live-common/exchange/providers/swap";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import ProviderIcon from "~/renderer/components/ProviderIcon";
import { openURL } from "~/renderer/linking";
import { CopyIconButton } from "./CopyIconButton";
import { DetailRow } from "./DetailRow";
import { truncateMiddle } from "../utils";

interface Props {
  feesAmount?: string;
  receiveAccountName?: string;
  provider?: string;
  providerData?: AdditionalProviderConfig;
  receiveCurrency?: CryptoOrTokenCurrency;
  swapId: string;
}

export function DetailsSection({
  feesAmount,
  receiveAccountName,
  provider,
  providerData,
  receiveCurrency,
  swapId,
}: Props) {
  const { t } = useTranslation();
  const providerName = provider ? getProviderName(provider) : undefined;

  return (
    <section>
      <dl className="m-0 flex flex-col gap-12">
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.networkFees")}
          value={feesAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
        />
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.receiveAccount")}
          value={
            receiveAccountName ? (
              <span className="inline-flex items-center gap-6">
                <span>{receiveAccountName}</span>
                {receiveCurrency ? (
                  <CryptoCurrencyIcon currency={receiveCurrency} size={16} />
                ) : null}
              </span>
            ) : (
              <Skeleton className="h-16 w-112 rounded-sm" />
            )
          }
        />
        {provider && providerName ? (
          <DetailRow
            label={t("swap2.modals.transactionStatus.sections.details.provider")}
            value={
              providerData?.mainUrl ? (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-6 border-0 bg-transparent p-0 body-3 text-base"
                  onClick={() => openURL(providerData.mainUrl!, "SwapTransactionStatus_Provider")}
                >
                  <span>{providerName}</span>
                  <ProviderIcon name={provider} size="XXS" boxed={false} />
                </button>
              ) : (
                <span className="inline-flex items-center gap-6">
                  <span className="body-3-semi-bold">{providerName}</span>
                  <ProviderIcon name={provider} size="XXS" boxed={false} />
                </span>
              )
            }
          />
        ) : null}
        <DetailRow
          label={t("swap2.modals.transactionStatus.sections.details.swapId")}
          value={
            <span className="inline-flex items-center gap-6">
              <p className="body-3-semi-bold">{truncateMiddle(swapId)}</p>
              <CopyIconButton text={swapId} />
            </span>
          }
        />
      </dl>
    </section>
  );
}
