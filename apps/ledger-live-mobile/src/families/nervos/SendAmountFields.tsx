// @flow
import React from "react";
import { Trans } from "react-i18next";
import LText from "../../components/LText";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SendAmountFields(props: any) {
  const { status, transaction } = props;
  let differenceAmount = "";
  if (!Object.keys(status.errors).length) {
    const differenceBigNumber = status.amount.minus(transaction.amount);
    if (!differenceBigNumber.eq(0)) {
      differenceAmount = differenceBigNumber.div(100000000).toString();
    }
  }
  return (
    <>
      {differenceAmount ? (
        <LText fontSize="12px">
          <Trans
            i18nKey="families.nervos.sendingMoreAmount"
            values={{ differenceAmount }}
          />
        </LText>
      ) : (
        ""
      )}
    </>
  );
}

export default SendAmountFields;
