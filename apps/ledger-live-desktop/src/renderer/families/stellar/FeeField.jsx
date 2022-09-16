// @flow

import React, { useCallback } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import Text from "~/renderer/components/Text";
import Label from "~/renderer/components/Label";
import Alert from "~/renderer/components/Alert";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";

const FeeField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: string => void,
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
}) => {
  invariant(transaction.family === "stellar", "FeeField: stellar family expected");

  const bridge = getAccountBridge(account);

  const onFeeValueChange = useCallback(
    fees => {
      onChange(bridge.updateTransaction(transaction, { fees }));
    },
    [onChange, transaction, bridge],
  );

  const { networkCongestionLevel } = transaction?.networkInfo || {};

  // We use transaction as an error here.
  return (
    <Box maxWidth="100%">
      <Box horizontal flow={5}>
        <Box>
          <Label style={{ width: "200px" }}>
            <Trans i18nKey="fees.feesAmount" />
          </Label>
          {networkCongestionLevel ? (
            <Text ff="Inter|Regular" fontSize={12} color="palette.text.shade50">
              <Trans
                i18nKey={`families.stellar.networkCongestionLevel.${networkCongestionLevel}`}
              />{" "}
              <Trans i18nKey="families.stellar.networkCongestion" />
            </Text>
          ) : null}
        </Box>
        <InputCurrency
          error={status.errors.transaction}
          warning={status.warnings.transaction}
          containerProps={{ grow: true }}
          defaultUnit={account.unit}
          value={transaction.fees}
          onChange={onFeeValueChange}
          renderRight={<InputRight>XLM</InputRight>}
        />
      </Box>

      {status.warnings?.transaction?.name === "StellarFeeSmallerThanRecommended" && (
        <Box mt={40}>
          <Alert type="secondary">
            <Trans i18nKey="families.stellar.recommenndedFeeInfo" />
          </Alert>
        </Box>
      )}
    </Box>
  );
};

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
}))`
  padding-right: 10px;
`;

export default FeeField;
