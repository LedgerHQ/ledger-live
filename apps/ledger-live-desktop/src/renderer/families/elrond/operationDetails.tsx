/* eslint-disable consistent-return */

import React, { Fragment, ComponentType } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import {
  ELROND_EXPLORER_URL,
  ELROND_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/elrond/constants";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  OpDetailsVoteData,
  B,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { Operation, Account } from "@ledgerhq/types-live";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
const getURLFeesInfo = (op: Operation): string | undefined | null => {
  if (op.fee.gt(200000)) {
    return urls.elrondStaking;
  }
};
const getURLWhatIsThis = (op: Operation): string | undefined | null => {
  if (op.type !== "IN" && op.type !== "OUT") {
    return urls.elrondStaking;
  }
};
const redirectAddress = (address: string) => () => {
  openURL(
    address === ELROND_LEDGER_VALIDATOR_ADDRESS
      ? urls.ledgerValidator
      : `${ELROND_EXPLORER_URL}/providers/${address}`,
  );
};
type OperationDetailsDelegationProps = {
  currency: Currency;
  account: Account;
  isTransactionField?: boolean;
  operation: Operation;
};
const OperationDetailsDelegation = (props: OperationDetailsDelegationProps) => {
  const { isTransactionField, account, operation } = props;
  const { validators } = useElrondPreloadData();
  const formattedValidator: ElrondProvider | undefined = validators.find(
    v => v.contract === operation.contract,
  );
  return (
    <OpDetailsSection>
      {!isTransactionField && (
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.validators"} />
        </OpDetailsTitle>
      )}

      <OpDetailsData key={operation.contract}>
        <OpDetailsVoteData>
          <Box>
            <Text>
              <Trans
                i18nKey="operationDetails.extra.votesAddress"
                values={{
                  votes: `${denominate({
                    input: operation.extra.amount,
                    decimals: 4,
                  })} ${getAccountUnit(account).code}`,
                  name: formattedValidator?.identity.name || operation.contract,
                }}
              >
                <Text ff="Inter|SemiBold">{""}</Text>
                {""}
                <Text ff="Inter|SemiBold">{""}</Text>
              </Trans>
            </Text>
          </Box>

          <Address onClick={redirectAddress(operation.contract)}>{operation.contract}</Address>
        </OpDetailsVoteData>
      </OpDetailsData>
    </OpDetailsSection>
  );
};
type OperationDetailsExtraProps = {
  extra: {
    [key: string]: string;
  };
  type: string;
  account: Account;
  operation: Operation;
};
const OperationDetailsExtra = (props: OperationDetailsExtraProps) => {
  const { type, account, operation } = props;
  const unit = getAccountUnit(account);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const { validators } = useElrondPreloadData();
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };
  let ret = null;
  switch (type) {
    case "DELEGATE": {
      return <OperationDetailsDelegation account={account} operation={operation} />;
    }
    case "UNDELEGATE": {
      const formattedValidator = validators.find(v => v.contract === operation.contract);
      const formattedAmount = formatCurrencyUnit(
        unit,
        BigNumber(operation.extra.amount),
        formatConfig,
      );
      ret = (
        <Fragment>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.undelegatedFrom" />
            </OpDetailsTitle>

            <OpDetailsData>
              <Address onClick={redirectAddress(operation.contract)}>
                {formattedValidator
                  ? formattedValidator.identity.name || formattedValidator.contract
                  : operation.contract}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>

          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.undelegatedAmount" />
            </OpDetailsTitle>

            <OpDetailsData>{formattedAmount}</OpDetailsData>
          </OpDetailsSection>
        </Fragment>
      );
      break;
    }
    case "WITHDRAW_UNBONDED": {
      const formattedValidator = validators.find(v => v.contract === operation.contract);
      const formattedAmount = formatCurrencyUnit(
        unit,
        BigNumber(operation.extra.amount),
        formatConfig,
      );
      ret = (
        <Fragment>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.withdrawnFrom" />
            </OpDetailsTitle>

            <OpDetailsData>
              <Address onClick={redirectAddress(operation.contract)}>
                {formattedValidator
                  ? formattedValidator.identity.name || formattedValidator.contract
                  : operation.contract}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>

          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.withdrawnAmount" />
            </OpDetailsTitle>

            <OpDetailsData>{formattedAmount}</OpDetailsData>
          </OpDetailsSection>
        </Fragment>
      );
      break;
    }
    case "REWARD": {
      const formattedValidator = validators.find(v => v.contract === operation.contract);
      ret = (
        <Fragment>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey="operationDetails.extra.rewardFrom" />
            </OpDetailsTitle>

            <OpDetailsData>
              <Address onClick={redirectAddress(operation.contract)}>
                {formattedValidator
                  ? formattedValidator.identity.name || formattedValidator.contract
                  : operation.contract}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>
        </Fragment>
      );
      break;
    }
    default:
      break;
  }
  return ret;
};
type Props = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
};
const UndelegateAmountCell = ({ operation, currency, unit }: Props) => {
  const amount: BigNumber = BigNumber(operation.extra.amount);
  return (
    !amount.isZero() && (
      <Fragment>
        <FormattedVal
          val={amount}
          unit={unit}
          showCode={true}
          fontSize={4}
          color="palette.text.shade80"
        />

        <CounterValue
          color="palette.text.shade60"
          fontSize={3}
          date={operation.date}
          currency={currency}
          value={amount}
        />
      </Fragment>
    )
  );
};
const amountCellExtra: {
  [key: string]: ComponentType<any>;
} = {
  UNDELEGATE: UndelegateAmountCell,
};
export { OperationDetailsDelegation };
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
