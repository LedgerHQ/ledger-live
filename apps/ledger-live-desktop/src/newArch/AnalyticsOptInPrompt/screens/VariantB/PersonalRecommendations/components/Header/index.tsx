import React from "react";
import DarkHeaderRecommandationsSVG from "./DarkHeaderSvg";
import LightHeaderRecommandationsSVG from "./LightHeaderSvg";

interface HeaderProps {
  currentTheme: "dark" | "light";
}

const Header = ({ currentTheme }: HeaderProps) => {
  return currentTheme === "dark" ? (
    <DarkHeaderRecommandationsSVG />
  ) : (
    <LightHeaderRecommandationsSVG />
  );
};

export default Header;
