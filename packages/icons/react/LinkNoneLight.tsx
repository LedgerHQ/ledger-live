import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function LinkNoneLight({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.968 20.832l.864-.864-16.8-16.8-.864.864 16.8 16.8zm-15.96-.84c1.752 1.728 4.608 1.728 6.36 0l3.096-3.072-.888-.912L9.48 19.08c-1.488 1.488-3.096 1.488-4.56 0-1.464-1.464-1.464-3.072 0-4.56l3.072-3.096-.912-.888-3.072 3.096c-1.728 1.752-1.728 4.608 0 6.36zM10.536 7.08l.912.888 3.096-3.072c1.464-1.464 3.096-1.464 4.56 0 1.464 1.464 1.464 3.096 0 4.56l-3.072 3.096.888.912 3.072-3.096c1.728-1.752 1.728-4.608 0-6.36-1.752-1.728-4.608-1.728-6.36 0L10.536 7.08z"  /></Svg>;
}

export default LinkNoneLight;