import React from "react";
import { useTranslation } from "react-i18next";
import type { Account, Operation } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "~/context/store";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "~/hooks/useAccountUnit";
import { useGetExtraDetails } from "@ledgerhq/live-common/families/sui/react";

type Props = {
  readonly account: Account;
  readonly operation: Operation;
};

function OperationDetailsExtra({ account, operation }: Props) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const extra = useGetExtraDetails(account, operation.type, operation.hash) ?? {};
  const { locale } = useSettings();
  const type = operation.type;

  const unit = useAccountUnit(account);
  if (type !== "DELEGATE" && type !== "UNDELEGATE") {
    return null;
  }

  if (!Object.keys(extra).length) {
    return null;
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(operation.value), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  return (
    <>
      <Section
        title={t("operationDetails.extra.validator")}
        value={extra.name ?? extra.address}
        testID="operationDetails-validator"
      />
      <Section
        title={t(
          type === "DELEGATE"
            ? "operationDetails.extra.delegatedAmount"
            : "operationDetails.extra.undelegatedAmount",
        )}
        value={formattedAmount}
        testID="operationDetails-delegatedAmount"
      />
    </>
  );
}

export default {
  OperationDetailsExtra,
};
