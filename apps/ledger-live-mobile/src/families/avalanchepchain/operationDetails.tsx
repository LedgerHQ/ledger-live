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
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import Section from "../../screens/OperationDetails/Section";
import { discreetModeSelector, localeSelector } from "../../reducers/settings";

type Props = {
  extra: {
    validator?: string;
    stakeValue: string;
  };
  type: OperationType;
  account: Account;
};

const OperationDetailsExtra = ({ extra, type, account }: Props) => {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);

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
  const { stakeValue, validator } = extra;

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(stakeValue), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  switch (type) {
    case "DELEGATE":
      ret = (
        <>
          {validator && (
            <Section
              title={t(`avalanchepchain.delegation.validator`)}
              value={validator}
              onPress={redirectAddressCreator(validator)}
            />
          )}
          <Section
            title={t(`operations.types.${type}`)}
            value={formattedAmount}
          />
        </>
      );
      break;
    default:
      break;
  }

  return <>{ret}</>;
};

export default {
  OperationDetailsExtra,
};
