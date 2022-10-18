import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import type { Account, OperationType, Operation } from "@ledgerhq/types-live";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

import { useSelector } from "react-redux";
import { CosmosDelegationInfo } from "@ledgerhq/live-common/families/cosmos/types";
import Section from "../../screens/OperationDetails/Section";
import { urls } from "../../config/urls";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

function getURLFeesInfo(op: Operation): string | undefined {
  return op.fee.gt(200000) ? urls.osmosisStakingRewards : undefined;
}

function getURLWhatIsThis(op: Operation): string | undefined {
  return op.type !== "IN" && op.type !== "OUT"
    ? urls.osmosisStakingRewards
    : undefined;
}

type Props = {
  extra: {
    validators: CosmosDelegationInfo[];
    sourceValidator?: string;
    memo?: string;
    autoClaimedRewards?: BigNumber;
  };
  type: OperationType;
  account: Account;
};

function OperationDetailsExtra({ extra, type, account }: Props) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const currencyName = account.currency.name.toLowerCase();
  const { validators: cosmosValidators } =
    useCosmosFamilyPreloadData(currencyName);

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

  let { autoClaimedRewards } = extra;
  if (autoClaimedRewards != null) {
    autoClaimedRewards = new BigNumber(autoClaimedRewards);
  }

  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

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
          {autoClaimedRewards != null && autoClaimedRewards.gt(0) ? (
            <Section
              title={t("operationDetails.extra.autoClaimedRewards")}
              value={formatCurrencyUnit(unit, autoClaimedRewards, formatConfig)}
            />
          ) : null}
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
          {autoClaimedRewards != null && autoClaimedRewards.gt(0) ? (
            <Section
              title={t("operationDetails.extra.autoClaimedRewards")}
              value={formatCurrencyUnit(unit, autoClaimedRewards, formatConfig)}
            />
          ) : null}
        </>
      );
      break;
    }
    case "REDELEGATE": {
      const { sourceValidator, validators } = extra;
      if (!validators || validators.length <= 0 || !sourceValidator) break;

      const validator = extra.validators[0];

      const formattedValidator = cosmosValidators.find(
        v => v.validatorAddress === validator.address,
      );

      const formattedSourceValidator = cosmosValidators.find(
        v => v.validatorAddress === sourceValidator,
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
                : sourceValidator
            }
            onPress={() => {
              redirectAddressCreator(sourceValidator);
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
          {autoClaimedRewards != null && autoClaimedRewards.gt(0) ? (
            <Section
              title={t("operationDetails.extra.autoClaimedRewards")}
              value={formatCurrencyUnit(unit, autoClaimedRewards, formatConfig)}
            />
          ) : null}
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
      {extra.memo ? (
        <Section title={t("operationDetails.extra.memo")} value={extra.memo} />
      ) : null}
    </>
  );
}

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
};
