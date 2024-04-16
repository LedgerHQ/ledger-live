import React from "react";
import Kiln from "~/icons/Kiln";
import { Lido } from "~/icons/Lido";
import Figment from "~/icons/Figment";
import Stader from "~/icons/Stader";
import MissingIcon from "~/icons/MissingIcon";

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
