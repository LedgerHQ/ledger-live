import React from "react";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { isFinalizablePosition, useBaker } from "@ledgerhq/live-common/families/tezos/react";
import type { StakingPosition } from "@ledgerhq/live-common/families/tezos/types";
import { useTranslation } from "~/context/Locale";
import DelegationRow from "./Row";

type Props = Readonly<{
  position: StakingPosition;
  unit: Unit;
  currency: Currency;
  onPress: () => void;
  isLast?: boolean;
}>;

export default function UnstakingRow({ position, unit, currency, onPress, isLast }: Props) {
  const { t } = useTranslation();
  const address = position.delegate ?? "";
  const baker = useBaker(address);
  const statusLabel = t(
    isFinalizablePosition(position.uid) ? "tezos.staking.available" : "tezos.staking.unstaking",
  );

  return (
    <DelegationRow
      baker={baker}
      address={address}
      amount={position.amount}
      unit={unit}
      currency={currency}
      statusLabel={statusLabel}
      onPress={onPress}
      isLast={isLast}
    />
  );
}
