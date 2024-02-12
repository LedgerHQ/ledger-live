import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";

import AccountSectionLabel from "~/components/AccountSectionLabel";
import Unbonding from "./components/Unbonding";

import type { UnbondingsPropsType } from "./types";
import type { UnbondingType } from "../../../../types";

/*
 * Handle the component declaration.
 */

const Unbondings = (props: UnbondingsPropsType) => {
  const { account, onDrawer, delegations } = props;
  const { t } = useTranslation();

  const currency = useMemo(() => getAccountCurrency(getMainAccount(account, undefined)), [account]);

  /*
   * Filter out delegations without unbondings, and reduce the rest into a single array, assigning the validator.
   */

  const unbondings = useMemo(
    () =>
      delegations.reduce((total: UnbondingType[], item) => {
        if (item.userUndelegatedList.length === 0) {
          return total;
        }

        return total.concat(
          item.userUndelegatedList.map(
            (unbonding: UnbondingType): UnbondingType =>
              Object.assign(unbonding, {
                validator: item.validator,
              }),
          ),
        );
      }, []),
    [delegations],
  );

  /*
   * Should there not be any unbondings available, don't render anything.
   */

  if (unbondings.length === 0) {
    return null;
  }

  /*
   * Return the rendered component, if unbondings do exist.
   */

  return (
    <View>
      <AccountSectionLabel name={t("account.undelegation.sectionLabel")} />

      {unbondings.map((unbonding, index) => (
        <Unbonding
          key={`unbonding-${index}`}
          last={unbondings.length === index + 1}
          onDrawer={onDrawer}
          currency={currency}
          {...unbonding}
        />
      ))}
    </View>
  );
};

export default Unbondings;
