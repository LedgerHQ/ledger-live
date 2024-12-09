import React, { useCallback } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useMultiversXPreloadData } from "@ledgerhq/live-common/families/multiversx/react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";

import type { MultiversXPreloadData } from "@ledgerhq/live-common/families/multiversx/types";
import type { DetailsPropsType } from "./types";

import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "~/hooks/useAccountUnit";

/*
 * Handle the component declaration.
 */

const Details = (props: DetailsPropsType) => {
  const { type, account, operation } = props;
  const { t } = useTranslation();

  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const unit = useAccountUnit(account);

  const { extra } = operation;
  const contract = operation && operation.contract ? operation.contract : "";
  const data: MultiversXPreloadData = useMultiversXPreloadData();
  const validator = data.validators.find(validator => contract === validator.contract);

  const name = validator ? validator.identity.name || validator.contract : "";
  const amount = formatCurrencyUnit(unit, extra.amount ?? new BigNumber(0), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale: locale,
  });

  /*
   * Upon requesting to open the explorer, retrieve the dynamic address, and open the link.
   */

  const openExplorer = useCallback(
    (address: string) => {
      const explorer = getAddressExplorer(getDefaultExplorerView(account.currency), address);

      if (explorer) {
        Linking.openURL(explorer);
      }
    },
    [account],
  );

  switch (type) {
    /*
     * Return the following fragment if the operation type is delegation.
     */

    case "DELEGATE":
      return (
        <View>
          {Boolean(name) && (
            <Section title={t("operationDetails.extra.delegatedTo")} value={name} />
          )}

          {Boolean(amount) && (
            <Section title={t("operationDetails.extra.delegatedAmount")} value={amount} />
          )}
        </View>
      );

    /*
     * Return the following fragment if the operation type is undelegation.
     */

    case "UNDELEGATE":
      return (
        <View>
          {Boolean(name) && (
            <Section title={t("operationDetails.extra.undelegatedFrom")} value={name} />
          )}

          {Boolean(amount) && (
            <Section
              title={t("operationDetails.extra.undelegatedAmount")}
              value={amount}
              onPress={() => openExplorer(contract)}
            />
          )}
        </View>
      );

    /*
     * Return the following fragment if the operation type is of claimable rewards.
     */

    case "REWARD":
      return (
        <View>
          {Boolean(name) && (
            <Section
              title={t("operationDetails.extra.rewardFrom")}
              onPress={() => openExplorer(contract)}
              value={name}
            />
          )}
        </View>
      );

    /*
     * Return the following fragment if the operation type is of withdrawal.
     */

    case "WITHDRAW_UNBONDED":
      return (
        <View>
          {Boolean(name) && (
            <Section title={t("operationDetails.extra.withdrawnFrom")} value={name} />
          )}

          {Boolean(amount) && (
            <Section
              title={t("operationDetails.extra.withdrawnAmount")}
              value={amount}
              onPress={() => openExplorer(contract)}
            />
          )}
        </View>
      );

    /*
     * Don't return anything in case none of the operation types above matched.
     */

    default:
      return null;
  }
};

export default Details;
