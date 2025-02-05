import React from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNftMetadata } from "@ledgerhq/live-nft-react";
import Operation, { Props } from "../Operation";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export const shouldFilterOperation = (
  spamFilteringTxFeature: { enabled: boolean } | null,
  nftsFromSimplehashFeature: { enabled: boolean; params?: { threshold?: number } } | null,
  spamScore?: number,
) => {
  if (!spamFilteringTxFeature?.enabled || !nftsFromSimplehashFeature?.enabled) return false;
  return spamScore && spamScore > (nftsFromSimplehashFeature.params?.threshold || 40);
};

export const OperationWrapper = ({
  operation,
  account,
  parentAccount,
  t,
  withAccount,
  onOperationClick,
  editable,
}: Props) => {
  const spamFilteringTxFeature = useFeature("spamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const currency = getAccountCurrency(account);
  const { metadata } = useNftMetadata(operation.contract, operation.tokenId, currency.id);

  if (
    shouldFilterOperation(spamFilteringTxFeature, nftsFromSimplehashFeature, metadata?.spamScore)
  ) {
    return <></>;
  }

  return (
    <Operation
      key={`${account.id}_${operation.id}`}
      operation={operation}
      account={account}
      parentAccount={parentAccount}
      onOperationClick={onOperationClick}
      t={t}
      withAccount={withAccount}
      editable={editable}
    />
  );
};
