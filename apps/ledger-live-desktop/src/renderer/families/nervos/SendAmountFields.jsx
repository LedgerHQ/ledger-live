// @flow
import React from "react";
import Text from "~/renderer/components/Text";
import { Trans, withTranslation } from "react-i18next";

const Root = (props: *) => {
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
        <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
          <Trans i18nKey="families.nervos.sendingMoreAmount" values={{ differenceAmount }} />
        </Text>
      ) : (
        ""
      )}
    </>
  );
};

export default {
  component: withTranslation()(Root),
  fields: [],
};
