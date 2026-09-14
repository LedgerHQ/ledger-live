import React, { useMemo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoUnbondingDisplayState } from "@ledgerhq/live-common/families/aleo/stakingDisplay";
import DelegationDrawer, {
  type Action,
  type FieldType,
  type IconProps,
} from "~/components/DelegationDrawer";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import Circle from "~/components/Circle";
import ClaimRewardIcon from "~/icons/ClaimReward";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import { useValidatorFields } from "./useValidatorFields";
import { getUnbondingStatusLabel } from "./unbondingStatusLabel";

type Props = {
  account: AleoAccount;
  position: AleoStakingPosition;
  unbonding: AleoUnbondingDisplayState;
  isOpen: boolean;
  onClose: () => void;
};

export default function UnstakingDrawer({ account, position, unbonding, isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unit = account.currency.units[0];
  const { unbondingBalance, unbondingHeight, claimableBalance } = position;
  // A fully unbonded position keeps no validator on chain, so the header has none to name.
  const label = position.validatorLabel || t("aleo.stake.unstakingRow.title");

  const validatorFields = useValidatorFields(account, position);

  const actions = useMemo<Action[]>(
    () => [
      // Disabled until the claim flow lands (LIVE-32812).
      {
        label: t("aleo.manage.claim"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={colors.lightFog}>
            <ClaimRewardIcon color={colors.grey} />
          </Circle>
        ),
        event: "AleoManageClaim",
        disabled: true,
      },
    ],
    [t, colors],
  );

  const data = useMemo<FieldType[]>(() => {
    const fields: FieldType[] = [
      ...validatorFields,
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
            <CurrencyUnitValue unit={unit} value={claimableBalance} showCode />
          </Text>
        ),
      });
    }

    return fields;
  }, [t, unit, validatorFields, position, unbonding, unbondingHeight, claimableBalance]);

  return (
    <DelegationDrawer
      undelegation
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      amount={unbondingBalance}
      ValidatorImage={({ size }) => <ValidatorImage size={size} name={label} />}
      data={data}
      actions={actions}
    />
  );
}
