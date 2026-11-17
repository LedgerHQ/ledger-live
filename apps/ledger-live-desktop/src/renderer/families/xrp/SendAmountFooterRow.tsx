import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Skeleton,
} from "@ledgerhq/lumen-ui-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { findSubAccountById } from "@ledgerhq/live-common/account/index";
import { getIssuerFeeAmount } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { XrpFamily } from "./types";

const SendAmountFooterRow: NonNullable<XrpFamily["SendAmountFooterRow"]> = ({
  account,
  transaction,
  status,
  bridgePending,
}) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const feeRate = useGetIssuerFeeQuery(tokenAccount?.token ?? skipToken);
  if (!tokenAccount || !status) return null;

  const hasFeeRate = typeof feeRate.data === "string" && Number(feeRate.data) > 0;
  const hasAmount = transaction.useAllAmount || transaction.amount.gt(0);
  const isFeeComputing = bridgePending && hasAmount;
  if (isFeeComputing && hasFeeRate) return <IssuerFeeRow label={t("xrp.send.issuerFee")} />;

  const issuerFee = getIssuerFeeAmount(status);
  if (!issuerFee) return null;

  const { displayFeesValue, secondaryFeesValue } = formatFeesValue({
    estimatedFees: issuerFee,
    estimatedFeesCountervalue: calculateCountervalue(tokenAccount.token, issuerFee),
    fiatUnit: counterValueCurrency.units[0],
    displayUnit: tokenAccount.token.units[0],
    locale,
    mode: "both",
  });

  return (
    <IssuerFeeRow label={t("xrp.send.issuerFee")}>
      <DescriptionItemValue>{displayFeesValue}</DescriptionItemValue>
      {secondaryFeesValue ? <span className="body-3 text-muted">{secondaryFeesValue}</span> : null}
    </IssuerFeeRow>
  );
};

function IssuerFeeRow(props: Readonly<{ label: string; children?: React.ReactNode }>) {
  return (
    <DescriptionItem size="sm" data-testid="xrp-send-issuer-fee-row" className="items-center pb-16">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{props.label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        {props.children ?? (
          <Skeleton
            className="h-12 w-64 rounded-full"
            data-testid="xrp-send-issuer-fee-loading"
            aria-hidden
          />
        )}
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}

export default SendAmountFooterRow;
