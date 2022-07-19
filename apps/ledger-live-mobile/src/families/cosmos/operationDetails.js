// @flow
import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import type {
  Account,
  OperationType,
  Operation,
} from "@ledgerhq/live-common/types/index";
import { useCosmosPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

import type { CosmosDelegationInfo } from "@ledgerhq/live-common/families/cosmos/types";
import { useSelector } from "react-redux";
import Section from "../../screens/OperationDetails/Section";
import { urls } from "../../config/urls";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

function getURLFeesInfo(op: Operation): ?string {
  return op.fee.gt(200000) ? urls.cosmosStakingRewards : undefined;
}

function getURLWhatIsThis(op: Operation): ?string {
  return op.type !== "IN" && op.type !== "OUT"
    ? urls.cosmosStakingRewards
    : undefined;
}

type Props = {
  extra: {
    validators: CosmosDelegationInfo[],
    cosmosSourceValidator?: string,
    memo?: string,
  },
  type: OperationType,
  account: Account,
};

function OperationDetailsExtra({ extra, type, account }: Props) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const { validators: cosmosValidators } = useCosmosPreloadData();

  const redirectAddressCreator = useCallback(
    address => () => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account],
  );

  let ret = null;

  switch (type) {
    case "DELEGATE": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) break;

      const validator = extra.validators[0];

      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );

      const formattedAmount = formatCurrencyUnit(
        unit,
        BigNumber(validator.amount),
        {
          disableRounding: true,
          alwaysShowSign: false,
          showCode: true,
          discreet,
          locale,
        },
      );

      ret = (
        <>
          <Section
            title={t("operationDetails.extra.delegatedTo")}
            value={
              formattedValidator?.name ??
              formattedValidator?.validatorAddress ??
              ""
            }
          />
          <Section
            title={t("operationDetails.extra.delegatedAmount")}
            value={formattedAmount}
          />
        </>
      );
      break;
    }
    case "UNDELEGATE": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) break;

      const validator = extra.validators[0];

      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );

      const formattedAmount = formatCurrencyUnit(
        unit,
        BigNumber(validator.amount),
        {
          disableRounding: true,
          alwaysShowSign: false,
          showCode: true,
          discreet,
          locale,
        },
      );

      ret = (
        <>
          <Section
            title={t("operationDetails.extra.undelegatedFrom")}
            value={formattedValidator?.name ?? validator.address}
            onPress={() => {
              redirectAddressCreator(validator.address);
            }}
          />
          <Section
            title={t("operationDetails.extra.undelegatedAmount")}
            value={formattedAmount}
          />
        </>
      );
      break;
    }
    case "REDELEGATE": {
      const { cosmosSourceValidator, validators } = extra;
      if (!validators || validators.length <= 0 || !cosmosSourceValidator)
        break;

      const validator = extra.validators[0];

      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );

      const formattedSourceValidator = cosmosValidators.find(
        v => v.validatorAddress === cosmosSourceValidator,
      );

      const formattedAmount = formatCurrencyUnit(
        unit,
        BigNumber(validator.amount),
        {
          disableRounding: true,
          alwaysShowSign: false,
          showCode: true,
          discreet,
          locale,
        },
      );

      ret = (
        <>
          <Section
            title={t("operationDetails.extra.redelegatedFrom")}
            value={
              formattedSourceValidator
                ? formattedSourceValidator.name
                : cosmosSourceValidator
            }
            onPress={() => {
              redirectAddressCreator(cosmosSourceValidator);
            }}
          />
          <Section
            title={t("operationDetails.extra.redelegatedTo")}
            value={
              formattedValidator ? formattedValidator.name : validator.address
            }
            onPress={() => {
              redirectAddressCreator(validator.address);
            }}
          />
          <Section
            title={t("operationDetails.extra.redelegatedAmount")}
            value={formattedAmount}
          />
        </>
      );
      break;
    }
    case "REWARD": {
      const { validators } = extra;
      if (!validators || validators.length <= 0) break;

      const validator = extra.validators[0];

      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );

      ret = (
        <>
          <Section
            title={t("operationDetails.extra.rewardFrom")}
            value={formattedValidator?.name ?? validator.address}
            onPress={() => {
              redirectAddressCreator(validator.address);
            }}
          />
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
        <Section title={t("operationDetails.extra.memo")} value={extra.memo} />
      )}
    </>
  );
}

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
};
