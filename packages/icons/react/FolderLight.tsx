import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FolderLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.88 20.16h18.24V5.688H12l-1.176-1.176c-.48-.48-.96-.672-1.656-.672H2.88v16.32zm1.2-1.152v-8.904h15.84v8.904H4.08zm0-10.056V4.968h5.088c.384 0 .528.072.816.36l1.512 1.488h8.424v2.136H4.08z"  /></Svg>;
}

export default FolderLight;