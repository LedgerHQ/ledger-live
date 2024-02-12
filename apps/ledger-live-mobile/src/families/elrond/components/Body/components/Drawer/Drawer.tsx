import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";

import DelegationDrawer from "~/components/DelegationDrawer";
import Circle from "~/components/Circle";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import LedgerLogo from "~/icons/LiveLogo";

import useDrawerActions from "./hooks/useDrawerActions";
import useDrawerItems from "./hooks/useDrawerItems";

import type { DrawerPropsType } from "./types";

/*
 * Handle the component declaration.
 */

const Drawer = (props: DrawerPropsType) => {
  const { data, account, onClose } = props;
  const { colors } = useTheme();

  /*
   * Extract the list of actions and items from the specific hooks.
   */

  const actions = useDrawerActions(data, account, onClose);
  const items = useDrawerItems(data, account);

  const name = useMemo(
    () => data.validator.identity.name || data.validator.contract,
    [data.validator],
  );

  /*
   * Return the rendered component.
   */

  return (
    <DelegationDrawer
      isOpen={true}
      onClose={onClose}
      amount={new BigNumber(data.amount)}
      actions={actions}
      account={account}
      data={items}
      ValidatorImage={({ size }) => (
        <Circle crop={true} size={size}>
          {ELROND_LEDGER_VALIDATOR_ADDRESS === data.validator.contract ? (
            <LedgerLogo size={size * 0.7} color={colors.text} />
          ) : (
            <FirstLetterIcon label={name || "-"} round={true} size={size} fontSize={24} />
          )}
        </Circle>
      )}
    />
  );
};

export default Drawer;
