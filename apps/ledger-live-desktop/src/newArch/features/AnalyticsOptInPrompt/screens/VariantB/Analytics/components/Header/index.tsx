import React from "react";
import DarkHeaderAnalyticsSVG from "./DarkHeaderSvg";
import LightHeaderAnalyticsSVG from "./LightHeaderSvg";

interface HeaderProps {
  currentTheme: "dark" | "light";
}

const Header = ({ currentTheme }: HeaderProps) => {
  return <>{currentTheme === "dark" ? <DarkHeaderAnalyticsSVG /> : <LightHeaderAnalyticsSVG />}</>;
};

export default Header;
