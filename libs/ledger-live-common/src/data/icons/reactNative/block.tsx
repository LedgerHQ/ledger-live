
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function block({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M8.26649 5.25H15.9375L19.875 12L15.9375 18.75H8.19824L12.0682 12L8.26574 5.25H8.26649ZM12.339 7.6245L14.8522 12L12.3397 16.3755H14.5807L17.0917 12L14.5792 7.6245H12.3397H12.339Z" fill={color} /><Path opacity={0.5} fillRule="evenodd" clipRule="evenodd" d="M9.08475 8.2695L6.90825 12L9.06525 15.6975L7.686 18.1042L4.125 12L7.71675 5.84175L9.08475 8.2695Z" fill={color} /><Path fillRule="evenodd" clipRule="evenodd" d="M8.26649 5.25H15.9375L19.875 12L15.9375 18.75H8.19824L12.0682 12L8.26574 5.25H8.26649ZM12.339 7.6245L14.8522 12L12.3397 16.3755H14.5807L17.0917 12L14.5792 7.6245H12.3397H12.339Z" fill={color} /><Path opacity={0.5} fillRule="evenodd" clipRule="evenodd" d="M9.08475 8.2695L6.90825 12L9.06525 15.6975L7.686 18.1042L4.125 12L7.71675 5.84175L9.08475 8.2695Z" fill={color} /></Svg>;
}
export default block;