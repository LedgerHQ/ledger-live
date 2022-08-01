// @flow
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";

import AccountSectionLabel from "../../../../components/AccountSectionLabel";
import Unbonding from "./components/Unbonding/index.jsx";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
});

const Unbondings = (props: any) => {
  const { unbondings, account, onDrawer, delegations } = props;
  const { t } = useTranslation();

  const currency = useMemo(
    () => getAccountCurrency(getMainAccount(account, undefined)),
    [account],
  );

  return (
    <View style={styles.wrapper}>
      <AccountSectionLabel name={t("account.undelegation.sectionLabel")} />

      {unbondings.map((unbonding, index) => (
        <Unbonding
          key={`unbonding-${index}`}
          last={unbondings.length === index + 1}
          {...{ ...unbonding, currency, onDrawer, delegations }}
        />
      ))}
    </View>
  );
};

export default Unbondings;
