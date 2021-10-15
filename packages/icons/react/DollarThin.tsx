import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function DollarThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M11.976 22.32h.48V20.4c2.784-.072 5.328-1.68 5.328-4.608 0-2.376-1.728-3.696-4.272-4.056l-1.056-.144V4.08c2.808.096 4.56 1.968 4.584 4.92h.48c-.024-3.192-2.04-5.28-5.064-5.4V1.68h-.48V3.6c-2.448.096-5.088 1.512-5.088 4.368 0 2.256 1.464 3.552 3.936 3.888l1.152.168v7.896c-3.216-.096-5.208-2.112-5.28-5.424h-.48c.072 3.6 2.376 5.784 5.76 5.904v1.92zM7.368 7.992v-.048c0-2.28 1.968-3.792 4.608-3.864v7.44l-1.104-.144c-2.256-.312-3.504-1.392-3.504-3.384zm5.088 11.928v-7.848l1.008.144c2.376.312 3.84 1.464 3.84 3.552v.048c0 2.472-2.04 4.032-4.848 4.104z"  /></Svg>;
}

export default DollarThin;