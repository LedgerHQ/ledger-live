import React, { useMemo } from "react";
import { useTheme } from "@react-navigation/native";
import BigNumber from "bignumber.js";

import DelegationDrawer from "../../../../../../components/DelegationDrawer";
import Circle from "../../../../../../components/Circle";
import FirstLetterIcon from "../../../../../../components/FirstLetterIcon";
import LedgerLogo from "../../../../../../icons/LiveLogo";
import { ledger } from "../../../../constants";

import useDrawerActions from "./hooks/useDrawerActions";
import useDrawerItems from "./hooks/useDrawerItems";

import type { DrawerPropsType } from "./types";

const Drawer = (props: DrawerPropsType) => {
  const { data, account, onClose } = props;
  const { colors } = useTheme();

  const actions = useDrawerActions(data, account, onClose);
  const items = useDrawerItems(data, account);

  const name = useMemo(
    () => data.validator.identity.name || data.validator.contract,
    [data.validator],
  );

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
          {ledger === data.validator.contract ? (
            <LedgerLogo size={size * 0.7} color={colors.text} />
          ) : (
            <FirstLetterIcon
              label={name || "-"}
              round={true}
              size={size}
              fontSize={24}
            />
          )}
        </Circle>
      )}
    />
  );
};

export default Drawer;
