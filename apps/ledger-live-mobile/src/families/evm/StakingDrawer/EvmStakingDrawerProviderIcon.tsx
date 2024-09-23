import React from "react";
import { Kiln } from "~/icons/Kiln";
import { Lido } from "~/icons/Lido";
import { Figment } from "~/icons/Figment";
import { Stader } from "~/icons/Stader";
import { MissingIcon } from "~/icons/MissingIcon";
import { KelpDAO } from "~/icons/KelpDAO";

type Props = {
  icon?: string;
};

const ICON_SIZE = 40;

export function EvmStakingDrawerProviderIcon({ icon = "" }: Props) {
  const [name] = icon.split(":");

  switch (name) {
    case "Kiln":
      return <Kiln size={ICON_SIZE} />;
    case "Lido":
      return <Lido size={ICON_SIZE} />;
    case "Figment":
      return <Figment size={ICON_SIZE} />;
    case "Stader":
      return <Stader size={ICON_SIZE} />;
    case "KelpDAO":
      return <KelpDAO size={ICON_SIZE} />;
    // TODO
    // case "RocketPool":
    //   return <RocketPool size={ICON_SIZE} />;
    // case "P2P":
    //   return <P2P size={ICON_SIZE} />;
    default:
      return <MissingIcon initialLetter={name.charAt(0)} size={ICON_SIZE} />;
  }
}
