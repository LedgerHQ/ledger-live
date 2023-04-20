/* eslint-disable consistent-return */
import { BigNumber } from "bignumber.js";
import React, { useMemo, ComponentType } from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import {
  CosmosDelegationInfo,
  CosmosValidatorItem,
} from "@ledgerhq/live-common/families/cosmos/types";
import { mapDelegationInfo } from "@ledgerhq/live-common/families/cosmos/logic";
import { Operation, Account } from "@ledgerhq/types-live";
import { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
import { openURL } from "~/renderer/linking";
import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  OpDetailsVoteData,
  B,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Ellipsis from "~/renderer/components/Ellipsis";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";
function getURLFeesInfo(op: Operation, currencyId: string): string | undefined | null {
  if (op.fee.gt(200000)) {
    return cryptoFactory(currencyId).stakingDocUrl;
  }
}
function getURLWhatIsThis(op: Operation, currencyId: string): string | undefined | null {
  if (op.type !== "IN" && op.type !== "OUT") {
    return cryptoFactory(currencyId).stakingDocUrl;
  }
}
export const redirectAddress = (currency: Currency, address: string) => () => {
  /** $FlowFixMe */
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url);
};
type OperationDetailsDelegationProps = {
  discreet: boolean;
  unit: Unit;
  currency: Currency;
  delegations: Array<CosmosDelegationInfo>;
  account: Account;
  isTransactionField?: boolean;
  validators: CosmosValidatorItem[];
};
export const OperationDetailsDelegation = ({
  discreet,
  unit,
  currency,
  delegations,
  account,
  isTransactionField,
  validators,
}: OperationDetailsDelegationProps) => {
  const mappedDelegationInfo = useMemo(() => mapDelegationInfo(delegations, validators, unit), [
    delegations,
    validators,
    unit,
  ]);
  return (
    <OpDetailsSection>
      {!isTransactionField && (
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.validators"} />
        </OpDetailsTitle>
      )}

      {mappedDelegationInfo.map(({ formattedAmount, validator, address }, i) => (
        <OpDetailsData key={address + i}>
          <OpDetailsVoteData>
            <Box>
              <Text>
                <Trans
                  i18nKey="operationDetails.extra.votesAddress"
                  values={{
                    votes: formattedAmount,
                    name: validator?.name ?? address,
                  }}
                >
                  <Text ff="Inter|SemiBold">{""}</Text>
                  {""}
                  <Text ff="Inter|SemiBold">{""}</Text>
                </Trans>
              </Text>
            </Box>
            <Address onClick={redirectAddress(currency, address)}>{address}</Address>
          </OpDetailsVoteData>
        </OpDetailsData>
      ))}
    </OpDetailsSection>
  );
};
type OperationDetailsExtraProps = {
  extra: {
    [key: string]: any;
  };
  type: string;
  account: Account;
};
const OperationDetailsExtra = ({ extra, type, account }: OperationDetailsExtraProps) => {
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const currencyName = account.currency.name.toLowerCase();
  const { validators: cosmosValidators } = useCosmosFamilyPreloadData(currencyName);
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
      const { validators: delegations } = extra;
      if (!delegations || !delegations.length) return null;
      return (
        <OperationDetailsDelegation
          discreet={discreet}
          unit={unit}
          currency={currency}
          delegations={delegations}
          account={account}
          validators={cosmosValidators}
        />
      );
    }
    case "UNDELEGATE": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) return null;
      const validator = extra.validators[0];
      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );
      const formattedAmount = formatCurrencyUnit(unit, BigNumber(validator.amount), formatConfig);
      ret = (
        <>
          <B />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.undelegatedFrom"} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Address onClick={redirectAddress(currency, validator.address)}>
                {formattedValidator ? formattedValidator.name : validator.address}
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
        </>
      );
      break;
    }
    case "REDELEGATE": {
      const { sourceValidator, validators } = extra;
      if (!validators || validators.length <= 0 || !sourceValidator) return null;
      const validator = extra.validators[0];
      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );
      const formattedSourceValidator = cosmosValidators.find(
        v => v.validatorAddress === sourceValidator,
      );
      const formattedAmount = formatCurrencyUnit(unit, BigNumber(validator.amount), formatConfig);
      ret = (
        <>
          <B />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.redelegatedFrom"} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Address onClick={redirectAddress(currency, sourceValidator)}>
                {formattedSourceValidator ? formattedSourceValidator.name : sourceValidator}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>
          <B />

          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.redelegatedTo"} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Address onClick={redirectAddress(currency, validator.address)}>
                {formattedValidator ? formattedValidator.name : validator.address}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.redelegatedAmount"} />
            </OpDetailsTitle>
            <OpDetailsData>{formattedAmount}</OpDetailsData>
          </OpDetailsSection>
        </>
      );
      break;
    }
    case "REWARD": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) return null;
      const validator = extra.validators[0];
      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );
      ret = (
        <>
          <B />
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"operationDetails.extra.rewardFrom"} />
            </OpDetailsTitle>
            <OpDetailsData>
              <Address onClick={redirectAddress(currency, validator.address)}>
                {formattedValidator ? formattedValidator.name : validator.address}
              </Address>
            </OpDetailsData>
          </OpDetailsSection>
        </>
      );
      break;
    }
    default:
      break;
  }
  return (
    <>
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
    </>
  );
};
type Props = {
  operation: Operation;
  currency: Currency;
  unit: Unit;
};
const RedelegateAmountCell = ({ operation, currency, unit }: Props) => {
  const amount =
    operation.extra && operation.extra.validators
      ? BigNumber(operation.extra.validators[0].amount)
      : BigNumber(0);
  return (
    !amount.isZero() && (
      <>
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
      </>
    )
  );
};
const UndelegateAmountCell = ({ operation, currency, unit }: Props) => {
  const amount =
    operation.extra && operation.extra.validators
      ? BigNumber(operation.extra.validators[0].amount)
      : BigNumber(0);
  return (
    !amount.isZero() && (
      <>
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
      </>
    )
  );
};
export const amountCellExtra: {
  [key: string]: ComponentType<any>;
} = {
  REDELEGATE: RedelegateAmountCell,
  UNDELEGATE: UndelegateAmountCell,
};
export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
