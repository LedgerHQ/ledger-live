import React from "react";
import { useTranslation } from "react-i18next";
import type { Account, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "~/hooks/useAccountUnit";

type Props = {
  account: Account;
  operation: Operation;
};

function OperationDetailsExtra({ account, operation }: Props) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();

  const unit = useAccountUnit(account);
  if (operation.type !== "STAKE") {
    return null;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(operation.value), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale: locale,
  });

  return (
    <>
      <Section
        title={t("operationDetails.extra.stakedAmount")}
        value={formattedAmount}
        testID="operationDetails-delegatedAmount"
      />
    </>
  );
}

export default {
  OperationDetailsExtra,
};
