import React from "react";
import { useTranslation } from "react-i18next";
import type { Account, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import Section from "~/screens/OperationDetails/Section";
import useFormat from "~/hooks/useFormat";

type Props = {
  account: Account;
  operation: Operation;
};

function OperationDetailsExtra({ account, operation }: Props) {
  const { t } = useTranslation();
  const { formatCurrency } = useFormat();

  if (operation.type !== "STAKE") {
    return null;
  }

  const unit = getAccountUnit(account);
  const formattedAmount = formatCurrency(unit, new BigNumber(operation.value));

  return (
    <>
      <Section title={t("operationDetails.extra.stakedAmount")} value={formattedAmount} />
    </>
  );
}

export default {
  OperationDetailsExtra,
};
