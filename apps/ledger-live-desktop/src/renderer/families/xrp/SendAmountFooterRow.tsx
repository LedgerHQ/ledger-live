import React from "react";
import { useTranslation } from "react-i18next";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-react";
import { findSubAccountById } from "@ledgerhq/live-common/account/index";
import { getIssuerFeeAmount } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import type { XrpFamily } from "./types";

const SendAmountFooterRow: NonNullable<XrpFamily["SendAmountFooterRow"]> = ({
  account,
  transaction,
  status,
}) => {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  if (!tokenAccount || !status) return null;

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
    <DescriptionItem size="sm" data-testid="xrp-send-issuer-fee-row" className="items-center pb-16">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{t("xrp.send.issuerFee")}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue>{displayFeesValue}</DescriptionItemValue>
        {secondaryFeesValue ? (
          <span className="body-3 text-muted">{secondaryFeesValue}</span>
        ) : null}
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
};

export default SendAmountFooterRow;
