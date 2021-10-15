import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function StorageMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 21.36c5.232 0 9.36-1.728 9.36-4.584v-9.6c0-2.832-3.984-4.536-9.36-4.536-5.208 0-9.36 1.68-9.36 4.536v9.6c0 2.856 4.032 4.584 9.36 4.584zm-7.44-4.584V14.88c1.656 1.08 4.32 1.68 7.44 1.68 3.072 0 5.76-.6 7.44-1.68v1.896c0 1.584-2.784 2.76-7.44 2.76-4.728 0-7.44-1.176-7.44-2.76zm0-6.744c1.656 1.08 4.32 1.656 7.44 1.656 3.072 0 5.76-.6 7.44-1.68v2.04c0 1.488-2.808 2.712-7.44 2.712-4.704 0-7.416-1.2-7.416-2.712l-.024-2.016zm.024-2.856C4.56 5.616 7.368 4.44 12 4.44c4.8 0 7.44 1.176 7.44 2.736 0 1.512-2.808 2.712-7.44 2.712-4.704 0-7.416-1.176-7.416-2.712z"  /></Svg>;
}

export default StorageMedium;