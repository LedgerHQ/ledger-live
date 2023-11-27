
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function emc({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M6 6V8.4H10.8V10.8H6V13.2H13.2V8.4H15.6V15.6H6V18H18V6H6Z" fill={color} /></svg>;
}
export default emc;