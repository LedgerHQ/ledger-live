import React, { memo } from "react";
import styled from "styled-components";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { GasOptions, Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types";
import { getTypedTransaction } from "@ledgerhq/coin-evm/transaction";
import TachometerMedium from "~/renderer/icons/TachometerMedium";
import CounterValue from "~/renderer/components/CounterValue";
import FormattedVal from "~/renderer/components/FormattedVal";
import TachometerHigh from "~/renderer/icons/TachometerHigh";
import TachometerLow from "~/renderer/icons/TachometerLow";
import Box, { Tabbable } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Clock from "~/renderer/icons/Clock";
import { getEstimatedFees } from "@ledgerhq/coin-evm/logic";
import { Strategy } from "@ledgerhq/coin-evm/lib/types";

type Props = {
  onClick: (_: { feesStrategy: Strategy }) => void;
  transaction: EvmTransaction;
  account: AccountLike;
  parentAccount: Account | null | undefined;
  gasOptions: GasOptions;
};

const FeesWrapper = styled(Tabbable)`
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: ${p =>
    `1px solid ${
      p?.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider
    }`};
  padding: 20px 16px;
  font-family: "Inter";
  border-radius: 4px;
  width: 140px;

  &:hover {
    cursor: "pointer";
  }
`;

const FeesHeader = styled(Box)<{ selected?: boolean }>`
  color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade50};
`;

const FeesValue = styled(Box)`
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ApproximateTransactionTime = styled(Box)<{ selected?: boolean }>`
  flex-direction: row;
  align-items: center;
  border-radius: 3px;
  background-color: ${p =>
    p.selected ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade20};
  padding: 5px 6px;
`;

const strategies: Strategy[] = ["slow", "medium", "fast"];

const SelectFeeStrategy = ({ transaction, account, parentAccount, onClick, gasOptions }: Props) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const accountUnit = getAccountUnit(mainAccount);
  const feesCurrency = getAccountCurrency(mainAccount);

  return (
    <Box horizontal justifyContent="center" flexWrap="wrap" gap="16px">
      {strategies.map(strategy => {
        const selected = transaction.feesStrategy === strategy;
        const gasOption = gasOptions[strategy];
        const estimatedFees = getEstimatedFees(getTypedTransaction(transaction, gasOption));

        return (
          <FeesWrapper
            key={strategy}
            selected={selected}
            onClick={() => {
              onClick({
                feesStrategy: strategy,
              });
            }}
          >
            <>
              <FeesHeader horizontal alignItems="center" selected={selected}>
                {strategy === "medium" ? (
                  <TachometerMedium size={13} />
                ) : strategy === "slow" ? (
                  <TachometerLow size={13} />
                ) : (
                  <TachometerHigh size={13} />
                )}
                <Text fontSize={0} ff="Inter|ExtraBold" uppercase ml={1} letterSpacing="0.1em">
                  <Trans i18nKey={`fees.${strategy}`} />
                </Text>
              </FeesHeader>
              <FeesValue>
                <FormattedVal
                  noShrink
                  inline
                  color={selected ? "palette.primary.main" : "palette.text.shade100"}
                  fontSize={3}
                  fontWeight="600"
                  val={estimatedFees}
                  unit={accountUnit}
                  showCode
                  alwaysShowValue
                />

                <CounterValue
                  currency={feesCurrency}
                  value={estimatedFees}
                  color={"palette.text.shade50"}
                  fontSize={3}
                  showCode
                  alwaysShowValue
                />
              </FeesValue>
              {feesCurrency.id === "ethereum" && (
                <ApproximateTransactionTime selected={selected}>
                  <Clock size={12} />
                  <Text fontSize={2} fontWeight="500" ml={1}>
                    {strategy === "medium" ? (
                      <>
                        ≈ 30 <Trans i18nKey={"time.second_short"} />
                      </>
                    ) : strategy === "slow" ? (
                      <>
                        ≈ 2-3 <Trans i18nKey={"time.minute_short"} />
                      </>
                    ) : (
                      <>
                        ≈ 15 <Trans i18nKey={"time.second_short"} />
                      </>
                    )}
                  </Text>
                </ApproximateTransactionTime>
              )}
            </>
          </FeesWrapper>
        );
      })}
    </Box>
  );
};

export default memo(SelectFeeStrategy);
