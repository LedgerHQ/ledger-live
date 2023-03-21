import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import type { Account, OperationType, Operation } from "@ledgerhq/types-live";
import { useCosmosFamilyPreloadData } from "@ledgerhq/live-common/families/cosmos/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import type { CosmosDelegationInfo } from "@ledgerhq/live-common/families/cosmos/types";
import { useSelector } from "react-redux";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";
import Section from "../../screens/OperationDetails/Section";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

function getURLFeesInfo(
  op: Operation,
  currencyId: string,
): string | null | undefined {
  return op.fee.gt(200000)
    ? cryptoFactory(currencyId).stakingDocUrl
    : undefined;
}

function getURLWhatIsThis(
  op: Operation,
  currencyId: string,
): string | null | undefined {
  return op.type !== "IN" && op.type !== "OUT"
    ? cryptoFactory(currencyId).stakingDocUrl
    : undefined;
}

type Props = {
  extra: {
    validators: CosmosDelegationInfo[];
    sourceValidator?: string;
    memo?: string;
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
