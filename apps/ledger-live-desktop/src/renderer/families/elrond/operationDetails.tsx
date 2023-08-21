/* eslint-disable consistent-return */

import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  ELROND_EXPLORER_URL,
  ELROND_LEDGER_VALIDATOR_ADDRESS,
} from "@ledgerhq/live-common/families/elrond/constants";
import { denominate } from "@ledgerhq/live-common/families/elrond/helpers/denominate";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { Account, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import React, { Fragment } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { urls } from "~/config/urls";
import Box from "~/renderer/components/Box/Box";
import CounterValue from "~/renderer/components/CounterValue";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import FormattedVal from "~/renderer/components/FormattedVal";
import Text from "~/renderer/components/Text";
import {
  Address,
  B,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { openURL } from "~/renderer/linking";
import { localeSelector } from "~/renderer/reducers/settings";
import { AmountCellExtraProps } from "../types";
const getURLFeesInfo = ({ op }: { op: Operation; currencyId: string }): string | undefined => {
  if (op.fee.gt(200000)) {
    return urls.elrondStaking;
  }
};
const getURLWhatIsThis = ({ op }: { op: Operation; currencyId: string }): string | undefined => {
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

      {operation.contract ? (
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
      ) : null}
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

            {operation.contract ? (
              <OpDetailsData>
                <Address onClick={redirectAddress(operation.contract)}>
                  {formattedValidator
                    ? formattedValidator.identity.name || formattedValidator.contract
                    : operation.contract}
                </Address>
              </OpDetailsData>
            ) : null}
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

            {operation.contract ? (
              <OpDetailsData>
                <Address onClick={redirectAddress(operation.contract)}>
                  {formattedValidator
                    ? formattedValidator.identity.name || formattedValidator.contract
                    : operation.contract}
                </Address>
              </OpDetailsData>
            ) : null}
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

            {operation.contract ? (
              <OpDetailsData>
                <Address onClick={redirectAddress(operation.contract)}>
                  {formattedValidator
                    ? formattedValidator.identity.name || formattedValidator.contract
                    : operation.contract}
                </Address>
              </OpDetailsData>
            ) : null}
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

const UndelegateAmountCell = ({ operation, currency, unit }: AmountCellExtraProps) => {
  const amount: BigNumber = BigNumber(operation.extra.amount);
  return !amount.isZero() ? (
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
  ) : null;
};
const amountCellExtra = {
  UNDELEGATE: UndelegateAmountCell,
};
export { OperationDetailsDelegation };
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
