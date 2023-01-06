import React, { useCallback } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useElrondPreloadData } from "@ledgerhq/live-common/families/elrond/react";
import { getAccountUnit } from "@ledgerhq/live-common/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import {
  getAddressExplorer,
  getDefaultExplorerView,
} from "@ledgerhq/live-common/explorers";

import type { ElrondPreloadData } from "@ledgerhq/live-common/families/elrond/types";
import type { DetailsPropsType } from "./types";

import Section from "../../../../screens/OperationDetails/Section";
import {
  discreetModeSelector,
  localeSelector,
} from "../../../../reducers/settings";

/*
 * Handle the component declaration.
 */

const Details = (props: DetailsPropsType) => {
  const { extra, type, account, operation } = props;
  const { t } = useTranslation();

  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const unit = getAccountUnit(account);

  const data: ElrondPreloadData = useElrondPreloadData();
  const validator = data.validators.find(
    validator => contract === validator.contract,
  );

  const contract = operation && operation.contract ? operation.contract : "";
  const name = validator ? validator.identity.name || validator.contract : "";
  const amount = formatCurrencyUnit(unit, BigNumber(extra.amount), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  /*
   * Upon requesting to open the explorer, retrieve the dynamic address, and open the link.
   */

  const openExplorer = useCallback(
    (address: string) => {
      const explorer = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );

      if (explorer) {
        Linking.openURL(explorer);
      }
    },
    [account],
  );

  /*
   * Return the following fragment if the operation type is delegation.
   */

  if (type === "DELEGATE") {
    return (
      <View>
        {Boolean(name) && (
          <Section
            title={t("operationDetails.extra.delegatedTo")}
            value={name}
          />
        )}

        {Boolean(amount) && (
          <Section
            title={t("operationDetails.extra.delegatedAmount")}
            value={amount}
          />
        )}

        {extra.memo && (
          <Section
            title={t("operationDetails.extra.memo")}
            value={extra.memo}
          />
        )}
      </View>
    );
  }

  /*
   * Return the following fragment if the operation type is undelegation.
   */

  if (type === "UNDELEGATE") {
    return (
      <View>
        {Boolean(name) && (
          <Section
            title={t("operationDetails.extra.undelegatedFrom")}
            value={name}
          />
        )}

        {Boolean(amount) && (
          <Section
            title={t("operationDetails.extra.undelegatedAmount")}
            value={amount}
            onPress={() => openExplorer(contract)}
          />
        )}

        {extra.memo && (
          <Section
            title={t("operationDetails.extra.memo")}
            value={extra.memo}
          />
        )}
      </View>
    );
  }

  /*
   * Return the following fragment if the operation type is of claimable rewards.
   */

  if (type === "REWARD") {
    return (
      <View>
        {Boolean(name) && (
          <Section
            title={t("operationDetails.extra.rewardFrom")}
            onPress={() => openExplorer(contract)}
            value={name}
          />
        )}

        {extra.memo && (
          <Section
            title={t("operationDetails.extra.memo")}
            value={extra.memo}
          />
        )}
      </View>
    );
  }

  /*
   * Don't return anything in case none of the operation types above matched.
   */

  return null;
};

export default Details;
