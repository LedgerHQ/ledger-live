import React, { useMemo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type {
  AleoAccount,
  AleoUnbondingDisplayState,
} from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import DelegationDrawer, { type Action, type FieldType } from "~/components/DelegationDrawer";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { makeValidatorImage } from "./ValidatorImage";
import { getUnbondingStatusLabel } from "./utils";

/** Claim arrives with its own flow in LIVE-32812. */
const NO_ACTIONS: Action[] = [];

type Props = Readonly<{
  account: AleoAccount;
  position: AleoStakingPositionView;
  unbonding: AleoUnbondingDisplayState;
  isOpen: boolean;
  onClose: () => void;
}>;

export default function UnstakingDrawer({ account, position, unbonding, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const unit = useAccountUnit(account);
  const { unbondingBalance, unbondingHeight, claimableBalance } = position;

  // unbonding funds aren't tied to a validator anymore
  const ValidatorImage = useMemo(() => makeValidatorImage(unit.name), [unit.name]);

  const data = useMemo<FieldType[]>(() => {
    const fields: FieldType[] = [
      {
        label: t("aleo.manage.status"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-status">
            {getUnbondingStatusLabel(t, position, unbonding)}
          </Text>
        ),
      },
    ];

    if (unbondingHeight !== null) {
      fields.push({
        label: t("aleo.manage.unlockBlock"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-unlock-block">
            {unbondingHeight}
          </Text>
        ),
      });
    }

    if (claimableBalance.gt(0)) {
      fields.push({
        label: t("aleo.stake.claimable"),
        Component: (
          <Text variant="body" fontWeight="semiBold" testID="aleo-unstaking-claimable">
            <CurrencyUnitValue unit={unit} value={claimableBalance} showCode disableRounding />
          </Text>
        ),
      });
    }

    return fields;
  }, [t, unit, position, unbonding, unbondingHeight, claimableBalance]);

  return (
    <DelegationDrawer
      undelegation
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      amount={unbondingBalance}
      ValidatorImage={ValidatorImage}
      data={data}
      actions={NO_ACTIONS}
    />
  );
}
