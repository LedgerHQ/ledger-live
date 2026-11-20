import React from "react";
import {
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import { findSubAccountById } from "@ledgerhq/live-common/account/index";
import { getIssuerFeeAmount } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { formatFeesValue } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { useSelector } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { counterValueCurrencySelector } from "~/reducers/settings";
import type { AmountFooterRowProps } from "~/screens/SendFunds/utils/customSendFlow";

export function SendAmountFooterRow({
  account,
  transaction,
  status,
}: Readonly<AmountFooterRowProps>) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const styles = useStyleSheet(
    theme => ({
      row: {
        alignItems: "center",
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );

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
    <DescriptionItem size="sm" style={styles.row} testID="xrp-send-issuer-fee-row">
      <DescriptionItemLeading>
        <DescriptionItemLabel>{t("xrp.send.issuerFee")}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>
        <DescriptionItemValue testID="xrp-send-issuer-fee-value">
          {displayFeesValue}
        </DescriptionItemValue>
        {secondaryFeesValue ? (
          <Text
            typography="body3"
            lx={{ color: "muted" }}
            testID="xrp-send-issuer-fee-secondary-value"
          >
            {secondaryFeesValue}
          </Text>
        ) : null}
      </DescriptionItemTrailing>
    </DescriptionItem>
  );
}
