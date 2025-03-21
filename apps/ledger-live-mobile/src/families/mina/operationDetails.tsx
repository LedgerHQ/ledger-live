import React from "react";
import { useTranslation } from "react-i18next";
import Section from "~/screens/OperationDetails/Section";
import { MinaOperation } from "@ledgerhq/live-common/families/mina/types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";

type Props = {
  operation: MinaOperation;
};

function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  return (
    <>
      {operation.extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={operation.extra.memo} />
      )}
      {operation.extra.accountCreationFee !== "0" && (
        <Section
          title={t("operationDetails.extra.accountCreationFee")}
          value={formatCurrencyUnit(
            getCryptoCurrencyById("mina").units[0],
            new BigNumber(operation.extra.accountCreationFee),
            { showCode: true },
          )}
        />
      )}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
