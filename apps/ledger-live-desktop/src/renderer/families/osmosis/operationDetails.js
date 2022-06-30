// @flow
import { BigNumber } from "bignumber.js";
import React from "react";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { getAccountCurrency, getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { useCosmosPreloadData } from "@ledgerhq/live-common/lib/families/cosmos/react";
import type { Operation, Account } from "@ledgerhq/live-common/lib/types";

import { urls } from "~/config/urls";
import {
  OperationDetailsDelegation,
  amountCellExtra,
  redirectAddress,
} from "../cosmos/operationDetails";
import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  B,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { localeSelector } from "~/renderer/reducers/settings";

function getURLFeesInfo(op: Operation): ?string {
  if (op.fee.gt(200000)) {
    return urls.osmosisStakingRewards;
  }
}

function getURLWhatIsThis(op: Operation): ?string {
  if (op.type !== "IN" && op.type !== "OUT") {
    return urls.osmosisStakingRewards;
  }
}

type OperationDetailsExtraProps = {
  extra: { [key: string]: any },
  type: string,
  account: Account,
};

const OperationDetailsExtra = ({ extra, type, account }: OperationDetailsExtraProps) => {
  const unit = getAccountUnit(account);
  const currency = getAccountCurrency(account);
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const { validators } = useCosmosPreloadData();

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
          validators={validators}
        />
      );
    }
    case "UNDELEGATE": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) return null;

      const validator = extra.validators[0];

      const formattedValidator = validators.find(v => v.validatorAddress === validator.address);

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

      const formattedValidator = validators.find(v => v.validatorAddress === validator.address);

      const formattedSourceValidator = validators.find(v => v.validatorAddress === sourceValidator);

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

      const formattedValidator = validators.find(v => v.validatorAddress === validator.address);

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

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
