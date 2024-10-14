import React from "react";
import { Kiln } from "~/icons/Kiln";
import { Lido } from "~/icons/Lido";
import { Figment } from "~/icons/Figment";
import { Stader } from "~/icons/Stader";
import { MissingIcon } from "~/icons/MissingIcon";
import { KelpDAO } from "~/icons/KelpDAO";
import { P2P } from "~/icons/P2P";
import { RocketPool } from "~/icons/RocketPool";
import type { ColorValue } from "react-native";

type Props = {
  icon?: string;
  outline?: ColorValue;
};

const ICON_SIZE = 40;

export function EvmStakingDrawerProviderIcon({ icon = "", outline }: Props) {
  const [name] = icon.split(":");

  switch (name) {
    case "Kiln":
      return <Kiln size={ICON_SIZE} outline={outline} />;
    case "Lido":
      return <Lido size={ICON_SIZE} outline={outline} />;
    case "Figment":
      return <Figment size={ICON_SIZE} outline={outline} />;
    case "Stader":
      return <Stader size={ICON_SIZE} outline={outline} />;
    case "KelpDAO":
      return <KelpDAO size={ICON_SIZE} outline={outline} />;
    case "RocketPool":
      return <RocketPool size={ICON_SIZE} outline={outline} />;
    case "P2P":
      return <P2P size={ICON_SIZE} outline={outline} />;
    default:
      return <MissingIcon initialLetter={name.charAt(0)} size={ICON_SIZE} />;
  }
}
