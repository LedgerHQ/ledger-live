import React from "react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import { RecentOperations } from "LLM/features/OperationsHistory/components/RecentOperations";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { SectionSkeleton } from "../SectionSkeleton";
import { useTransactionsViewModel } from "./useTransactionsViewModel";

type Props = Readonly<{
  currency?: CryptoOrTokenCurrency;
  distributionItem?: DistributionItem;
  isLoading: boolean;
}>;

export function Transactions({ currency, distributionItem, isLoading }: Props) {
  const { t } = useTranslation();
  const { accountIds, currencyId } = useTransactionsViewModel(currency, distributionItem);

  return (
    <RecentOperations
      accountIds={accountIds}
      trackingPage="Asset Detail"
      trackingCurrencyId={currencyId}
      title={t("assetDetail.transactions.title")}
      testID={ASSET_DETAIL_TEST_IDS.transactions}
      headerTestID={ASSET_DETAIL_TEST_IDS.transactionsHeader}
      fallback={isLoading ? <SectionSkeleton rows={1} rowHeight="s56" /> : null}
    />
  );
}
