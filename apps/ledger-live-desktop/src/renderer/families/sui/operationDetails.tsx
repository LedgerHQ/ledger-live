import React from "react";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import { AmountCellExtraProps, OperationDetailsExtraProps } from "../types";
import { SuiAccount, SuiOperation } from "@ledgerhq/live-common/families/sui/types";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { Operation } from "@ledgerhq/types-live";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import BigNumber from "bignumber.js";
import { useGetExtraDetails } from "@ledgerhq/live-common/families/sui/react";
import { localeSelector } from "~/renderer/reducers/settings";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { Divider } from "@ledgerhq/react-ui/index";

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<SuiAccount, Operation>) => {
  const unit = useAccountUnit(account);
  const extra = useGetExtraDetails(account, type, operation.hash) ?? {};
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  if (!extra.amount) {
    return null;
  }
  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(extra.amount), formatConfig);

  if (type === "UNDELEGATE") {
    return (
      <>
        <Divider />
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"operationDetails.extra.undelegatedFrom"} />
          </OpDetailsTitle>
          <OpDetailsData>
            <Address>{extra.name ?? extra.address}</Address>
          </OpDetailsData>
        </OpDetailsSection>
        <Divider />
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"operationDetails.extra.undelegatedAmount"} />
          </OpDetailsTitle>
          <OpDetailsData>{formattedAmount}</OpDetailsData>
        </OpDetailsSection>
      </>
    );
  }

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.validators"} />
      </OpDetailsTitle>

      <OpDetailsData>
        <OpDetailsVoteData>
          <Box>
            <Text>
              <Trans
                i18nKey="operationDetails.extra.votesAddress"
                values={{
                  votes: formattedAmount,
                  name: extra?.name ?? extra.address,
                }}
              >
                <Text ff="Inter|SemiBold">{""}</Text>
                {""}
                <Text ff="Inter|SemiBold">{""}</Text>
              </Trans>
            </Text>
          </Box>
        </OpDetailsVoteData>
      </OpDetailsData>
    </OpDetailsSection>
  );
};
// A stake operation's value is only its gas (minus the reward for an unstake); the staked
// principal is shown beside it.
const StakingAmountCell = ({ operation, currency, unit }: AmountCellExtraProps<SuiOperation>) => {
  const stakedAmount = operation.extra?.stakedAmount;
  if (!stakedAmount) return null;
  const amount = new BigNumber(stakedAmount);
  return (
    <>
      <FormattedVal val={amount} unit={unit} showCode fontSize={4} color={"neutral.c80"} />
      <CounterValue
        color="neutral.c70"
        fontSize={3}
        date={operation.date}
        currency={currency}
        value={amount}
      />
    </>
  );
};

const amountCellExtra = {
  DELEGATE: StakingAmountCell,
  UNDELEGATE: StakingAmountCell,
};

export default {
  OperationDetailsExtra,
  amountCellExtra,
};
