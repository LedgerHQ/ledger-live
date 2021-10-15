import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function FiveCircledThin({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 20.88c4.968 0 8.88-4.032 8.88-8.88 0-4.968-3.912-8.88-8.88-8.88-4.968 0-8.88 3.912-8.88 8.88 0 4.968 3.912 8.88 8.88 8.88zM3.6 12c0-4.704 3.696-8.4 8.4-8.4 4.704 0 8.4 3.696 8.4 8.4 0 4.584-3.696 8.4-8.4 8.4-4.704 0-8.4-3.696-8.4-8.4zm5.328 1.752c0 1.632 1.176 2.952 3.072 2.952 1.896 0 3.072-1.32 3.072-3.096 0-1.824-1.248-3.096-3-3.096-.96 0-1.752.432-2.232 1.128h-.024l.336-3.576h4.416v-.48H9.72l-.48 5.16h.48c.312-1.056 1.08-1.752 2.328-1.752h.048c1.536 0 2.496 1.008 2.496 2.592v.048c0 1.584-.912 2.592-2.568 2.592h-.048c-1.656 0-2.568-1.032-2.568-2.472h-.48z"  /></Svg>;
}

export default FiveCircledThin;