import React from "react";
import type { ColorValue } from "react-native";
import { MissingIcon } from "~/icons/MissingIcon";
import { Acre } from "~/icons/providers/Acre";
import { Babylon } from "~/icons/providers/Babylon";
import { ChorusOne } from "~/icons/providers/ChorusOne";
import { Coinbase } from "~/icons/providers/Coinbase";
import { EigenLayer } from "~/icons/providers/EigenLayer";
import { Figment } from "~/icons/providers/Figment";
import { KelpDAO } from "~/icons/providers/KelpDAO";
import { Kiln } from "~/icons/providers/Kiln";
import { Lido } from "~/icons/providers/Lido";
import { Midas } from "~/icons/providers/Midas";
import { P2P } from "~/icons/providers/P2P";
import { RocketPool } from "~/icons/providers/RocketPool";
import { Stader } from "~/icons/providers/Stader";

type Props = {
  icon?: string;
  outline?: ColorValue;
};

const ICON_SIZE = 40;

export function EvmStakingDrawerProviderIcon({ icon = "", outline }: Props) {
  const [name] = icon.split(":");

  switch (name) {
    case "Acre":
      return <Acre size={ICON_SIZE} outline={outline} />;
    case "Babylon":
      return <Babylon size={ICON_SIZE} outline={outline} />;
    case "ChorusOne":
      return <ChorusOne size={ICON_SIZE} outline={outline} />;
    case "Coinbase":
      return <Coinbase size={ICON_SIZE} outline={outline} />;
    case "EigenLayer":
      return <EigenLayer size={ICON_SIZE} outline={outline} />;
    case "Figment":
      return <Figment size={ICON_SIZE} outline={outline} />;
    case "KelpDAO":
      return <KelpDAO size={ICON_SIZE} outline={outline} />;
    case "Kiln":
      return <Kiln size={ICON_SIZE} outline={outline} />;
    case "Lido":
      return <Lido size={ICON_SIZE} outline={outline} />;
    case "Midas":
      return <Midas size={ICON_SIZE} outline={outline} />;
    case "P2P":
      return <P2P size={ICON_SIZE} outline={outline} />;
    case "RocketPool":
      return <RocketPool size={ICON_SIZE} outline={outline} />;
    case "Stader":
      return <Stader size={ICON_SIZE} outline={outline} />;
    default:
      return <MissingIcon initialLetter={name.charAt(0)} size={ICON_SIZE} />;
  }
}
