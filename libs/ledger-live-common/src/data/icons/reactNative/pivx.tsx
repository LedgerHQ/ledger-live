
      // @ts-nocheck

      import * as React from "react";
import Svg, { Path } from "react-native-svg";
interface Props {
              size: number;
              color: string;
            };
function pivx({ size, color }: Props) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path fillRule="evenodd" clipRule="evenodd" d="M7.5 9.18075H12.1147V10.122H7.5V9.18075ZM16.5 9.62325C16.5 11.8538 14.9175 13.2945 12.729 13.2945H9.6975V18H8.4975V12.2302H12.5662C14.1975 12.2302 15.2625 11.2613 15.2625 9.62325C15.2625 8.00475 14.1975 7.0635 12.585 7.0635H11.319L8.28675 7.07325V6H12.7192C14.9167 6 16.4993 7.39275 16.4993 9.62325H16.5Z" fill={color} /></Svg>;
}
export default pivx;