import React from "react";
import { useSelector } from "react-redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";
export const useDiscreetMode = () => useSelector(discreetModeSelector);

type Props = {
  children: React.ReactNode;
  replace?: React.ReactNode;
};

const Discreet = ({ children, replace }: Props) => {
  const discreetMode = useDiscreetMode();
  return <>{discreetMode ? (replace === undefined ? "***" : replace) : children}</>;
};

export default Discreet;
