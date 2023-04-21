import React from "react";
import { Trans } from "react-i18next";
import {
  getAccountCurrency,
  getFeesCurrency,
  getFeesUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import Box from "~/renderer/components/Box";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";
import FormattedVal from "~/renderer/components/FormattedVal";
import Label from "~/renderer/components/Label";
import CounterValue from "~/renderer/components/CounterValue";
type Props = {
  account: AccountLike;
  parentAccount: Account | undefined | null;
  status: TransactionStatus;
};
const AccountFooter = ({ account, parentAccount, status }: Props) => {
  const currency = getAccountCurrency(account);
  const mainAccount = getMainAccount(account, parentAccount);
  const feesCurrency = getFeesCurrency(mainAccount);
  const feesUnit = getFeesUnit(feesCurrency);
  return (
    <>
      <CurrencyCircleIcon size={40} currency={currency} />
      <Box grow>
        <Label
          fontSize={3}
          style={{
            lineHeight: "20px",
          }}
        >
          <Trans i18nKey="send.footer.estimatedFees" />
        </Label>
        {feesUnit && (
          <>
            <FormattedVal
              style={{
                width: "auto",
                lineHeight: "15px",
              }}
              color="palette.text.shade100"
              val={status.estimatedFees}
              unit={feesUnit}
              showCode
              alwaysShowValue
            />
            <CounterValue
              color="palette.text.shade60"
              fontSize={2}
              horizontal
              style={{
                lineHeight: "12px",
              }}
              currency={feesCurrency}
              value={status.estimatedFees}
              alwaysShowSign={false}
              alwaysShowValue
            />
          </>
        )}
      </Box>
    </>
  );
};
export default AccountFooter;
