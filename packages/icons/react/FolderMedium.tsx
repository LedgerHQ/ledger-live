import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FolderMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M2.64 20.4h18.72V5.448H12l-1.176-1.176c-.48-.48-.96-.672-1.656-.672H2.64v16.8zm1.92-1.8v-7.704h14.88V18.6H4.56zm0-9.504V5.4h4.608c.144 0 .144 0 .288.144l1.704 1.704h8.28v1.848H4.56z"  /></Svg>;
}

export default FolderMedium;