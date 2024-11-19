import React from "react";
import MissingIcon from "~/icons/MissingIcon";
import { Figment } from "~/icons/providers/Figment";
import { Kiln } from "~/icons/providers/Kiln";
import { Lido } from "~/icons/providers/Lido";
import { Stader } from "~/icons/providers/Stader";

type Props = {
  icon?: string;
};

export function EvmStakingDrawerProviderIcon({ icon = "" }: Props) {
  const [name] = icon.split(":");

  if (name === "Kiln") {
    return <Kiln size={32} />;
  }
  if (name === "Lido") {
    return <Lido size={32} />;
  }
  if (name === "Stader") {
    return <Stader size={32} />;
  }
  if (name === "Figment") {
    return <Figment size={32} />;
  }
  return <MissingIcon initialLetter={name.charAt(0)} size={32} />;
}
