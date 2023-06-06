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
  const currencyId = account.currency.id;
  const { validators: cosmosValidators } =
    useCosmosFamilyPreloadData(currencyId);
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

  const getValidatorName = (validatorAddress: string) => {
    const relatedValidator = cosmosValidators.find(
      v => v.validatorAddress === validatorAddress,
    );
    return relatedValidator ? relatedValidator.name : validatorAddress;
  };

  const OperationDetailsSection = (
    <>
      {extra.memo && (
        <Section title={t("operationDetails.extra.memo")} value={extra.memo} />
      )}
    </>
  );

  if (!extra.validators || extra.validators.length <= 0) {
    return <>{OperationDetailsSection}</>;
  }

  let ret = null;

  switch (type) {
    case "DELEGATE": {
      const validator = extra.validators[0];
      const formattedValidator = getValidatorName(validator.address);
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
            value={formattedValidator}
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
      const validator = extra.validators[0];
      const formattedValidator = getValidatorName(validator.address);
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
            value={formattedValidator}
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
      const { sourceValidator } = extra;
      if (!sourceValidator) break;
      const validator = extra.validators[0];
      const formattedValidator = getValidatorName(validator.address);
      const formattedSourceValidator = getValidatorName(sourceValidator);
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
            value={formattedSourceValidator}
            onPress={() => {
              redirectAddressCreator(sourceValidator);
            }}
          />
          <Section
            title={t("operationDetails.extra.redelegatedTo")}
            value={formattedValidator}
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
      ret = (
        <>
          {validators.map(v => (
            <Section
              key={v.address}
              title={t("operationDetails.extra.rewardFrom")}
              value={
                getValidatorName(v.address) +
                " " +
                formatCurrencyUnit(unit, BigNumber(v.amount), {
                  disableRounding: true,
                  alwaysShowSign: false,
                  showCode: true,
                  discreet,
                  locale,
                })
              }
              onPress={() => {
                redirectAddressCreator(v.address);
              }}
            />
          ))}
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
      {OperationDetailsSection}
    </>
  );
}

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
};
