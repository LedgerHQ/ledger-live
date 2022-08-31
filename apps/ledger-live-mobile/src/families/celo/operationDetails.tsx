import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import { Account, OperationType } from "@ledgerhq/types-live";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/formatCurrencyUnit";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";

import Section from "../../screens/OperationDetails/Section";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

type Props = {
  extra: {
    celoSourceValidator?: string;
    celoOperationValue: string;
    memo?: string;
  };
  type: OperationType;
  account: Account;
};

const OperationDetailsExtra = ({ extra, type, account }: Props) => {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);
  const { validatorGroups: celoValidators } = useCeloPreloadData();

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
  const recipient = extra.celoSourceValidator;
  const validatorGroup = recipient
    ? celoValidators.find(
        validatorGroup =>
          validatorGroup.address.toLowerCase() === recipient.toLowerCase(),
      )
    : null;

  const formattedAmount = formatCurrencyUnit(
    unit,
    new BigNumber(extra.celoOperationValue),
    {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
      discreet,
      locale,
    },
  );

  switch (type) {
    case "ACTIVATE":
    case "REVOKE":
    case "VOTE":
    case "UNLOCK":
    case "LOCK":
      ret = (
        <>
          {(validatorGroup || extra.celoSourceValidator) && (
            <Section
              title={t(`delegation.validatorGroup`)}
              value={validatorGroup?.name || extra.celoSourceValidator}
              onPress={redirectAddressCreator(
                validatorGroup?.address || extra.celoSourceValidator,
              )}
            />
          )}
          {type !== "ACTIVATE" && (
            <>
              <Section
                title={t(`operations.types.${type}`)}
                value={formattedAmount}
              />
            </>
          )}
        </>
      );
      break;
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
};

export default {
  OperationDetailsExtra,
};
