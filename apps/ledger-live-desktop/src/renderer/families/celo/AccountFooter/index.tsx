import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import { CeloFamily } from "../types";
import {
  findSubAccountById,
  getAccountCurrency,
  getFeesCurrency,
  getFeesUnit,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { CurrencyCircleIcon } from "~/renderer/components/CurrencyBadge";

const AccountFooter: NonNullable<CeloFamily["AccountFooter"]> = ({
  account,
  status,
  parentAccount,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const feeCurrencyAccount = useMemo(
    () =>
      status.feeCurrencyAccountId
        ? findSubAccountById(mainAccount, status.feeCurrencyAccountId)
        : undefined,
    [mainAccount, status.feeCurrencyAccountId],
  );
  const currency = getAccountCurrency(feeCurrencyAccount ?? account);
  const feesCurrency = getFeesCurrency(feeCurrencyAccount ?? mainAccount);
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
              color="neutral.c100"
              val={status.estimatedFees}
              unit={feesUnit}
              showCode
              alwaysShowValue
            />
            <CounterValue
              color="neutral.c70"
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
