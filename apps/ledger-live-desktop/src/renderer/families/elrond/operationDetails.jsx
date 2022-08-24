// @flow
/* eslint-disable consistent-return */

import React, { Fragment } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";

import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
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
import { denominate } from "~/renderer/families/elrond/helpers";
import { constants } from "~/renderer/families/elrond/constants";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

import type { ComponentType } from "react";
import type { Operation, Account } from "@ledgerhq/types-live";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";

const getURLFeesInfo = (op: Operation): ?string => {
  if (op.fee.gt(200000)) {
    return urls.elrondStaking;
  }
};

const getURLWhatIsThis = (op: Operation): ?string => {
  if (op.type !== "IN" && op.type !== "OUT") {
    return urls.elrondStaking;
  }
};

const redirectAddress = (address: string) => () => {
  openURL(
    address === constants.figment
      ? urls.ledgerValidator
      : `${constants.explorer}/providers/${address}`,
  );
};

type OperationDetailsDelegationProps = {
  currency: Currency,
  account: Account,
  isTransactionField?: boolean,
  operation: Operation,
};

const OperationDetailsDelegation = (props: OperationDetailsDelegationProps) => {
  const { isTransactionField, account, operation } = props;
  const formattedValidator = account.elrondResources.providers.find(
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
                  votes: `${denominate({ input: operation.value, decimals: 6 })} ${
                    constants.egldLabel
                  }`,
                  name: formattedValidator
                    ? formattedValidator.identity.name || operation.contract
                    : operation.contract,
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
  extra: { [key: string]: string },
  type: string,
  account: Account,
  operation: Operation,
};

const OperationDetailsExtra = (props: OperationDetailsExtraProps) => {
  const { extra, type, account, operation } = props;

  const unit = getAccountUnit(account);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);

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
      const { providers } = account.elrondResources;
      if (!providers || providers.length <= 0) return null;

      return <OperationDetailsDelegation {...{ account, operation }} />;
    }

    case "UNDELEGATE": {
      const { providers } = account.elrondResources;
      if (!providers || providers.length <= 0) return null;

      const formattedValidator = providers.find(v => v.contract === operation.contract);
      const formattedAmount = formatCurrencyUnit(unit, BigNumber(operation.value), formatConfig);

      ret = (
        <Fragment>
          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.undelegatedFrom"} />
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
              <Trans i18nKey={"operationDetails.extra.undelegatedAmount"} />
            </OpDetailsTitle>

            <OpDetailsData>{formattedAmount}</OpDetailsData>
          </OpDetailsSection>
        </Fragment>
      );
      break;
    }

    case "WITHDRAW_UNBONDED": {
      const { providers } = account.elrondResources;
      if (!providers || providers.length <= 0) return null;

      const formattedValidator = providers.find(v => v.contract === operation.contract);
      const formattedAmount = formatCurrencyUnit(unit, BigNumber(operation.value), formatConfig);

      ret = (
        <Fragment>
          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.withdrawnFrom"} />
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
              <Trans i18nKey={"operationDetails.extra.withdrawnAmount"} />
            </OpDetailsTitle>

            <OpDetailsData>{formattedAmount}</OpDetailsData>
          </OpDetailsSection>
        </Fragment>
      );
      break;
    }

    case "REWARD": {
      const { providers } = account.elrondResources;
      if (!providers || providers.length <= 0) return null;

      const formattedValidator = providers.find(v => v.contract === operation.contract);

      ret = (
        <Fragment>
          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.rewardFrom"} />
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

  return (
    <Fragment>
      {ret}

      {extra.memo && (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey={"operationDetails.extra.memo"} />
          </OpDetailsTitle>

          <OpDetailsData>
            <Ellipsis ml={2}>{extra.memo}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      )}
    </Fragment>
  );
};

type Props = {
  operation: Operation,
  currency: Currency,
  unit: Unit,
};

const UndelegateAmountCell = ({ operation, currency, unit }: Props) => {
  const amount =
    operation.extra && operation.extra.validators
      ? BigNumber(operation.extra.validators[0].amount)
      : BigNumber(0);

  return (
    !amount.isZero() && (
      <Fragment>
        <FormattedVal
          val={amount}
          unit={unit}
          showCode
          fontSize={4}
          color={"palette.text.shade80"}
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

const amountCellExtra: { [key: string]: ComponentType<any> } = {
  UNDELEGATE: UndelegateAmountCell,
};

export { OperationDetailsDelegation };
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
