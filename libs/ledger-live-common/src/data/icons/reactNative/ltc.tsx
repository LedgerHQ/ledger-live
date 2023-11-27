
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function ltc({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M7.82025 14.4105L6.75 14.826L7.266 12.7568L8.349 12.3218L9.90975 6H13.7565L12.6172 10.647L13.6747 10.2188L13.1647 12.2812L12.0945 12.7095L11.4585 15.3218H17.25L16.5953 18H6.939L7.82025 14.4105Z" fill={color} /></Svg>;
}
export default ltc;