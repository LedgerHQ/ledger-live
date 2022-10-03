import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};
const DefaultColor = "#F5D100";

function NPXS({
  size = 16,
  color = DefaultColor
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.993 3.017c-4.95 0-8.98 4.03-8.98 8.98s4.03 8.986 8.987 8.986 8.986-4.03 8.986-8.987-4.036-8.979-8.992-8.979h-.001zm0 17.273c-4.57 0-8.294-3.717-8.294-8.294.008-4.569 3.725-8.287 8.294-8.287 4.57 0 8.294 3.718 8.294 8.295 0 4.569-3.718 8.287-8.294 8.287v-.001z"  /><path d="M7.344 8.01l.66-.661 3.516 3.515-.66.66-3.516-3.515zm5.114 5.115l.66-.66 3.516 3.514-.66.66-3.516-3.514zm-1.121-1.127l.66-.66.666.665-.66.662-.666-.666zm1.13-1.106l3.516-3.514.66.66-3.515 3.516-.66-.662zM7.37 15.983l3.514-3.514.661.66-3.514 3.515-.661-.66z"  /></Svg>;
}

NPXS.DefaultColor = DefaultColor;
export default NPXS;