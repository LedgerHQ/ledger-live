
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function icn({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M15.9998 5.25H18V18.75H15.9998V5.25ZM12.6667 12H14.667V18.75H12.6667V12ZM9.333 8.625H11.3333V18.75H9.333V8.625ZM6 15.375H8.00025V18.75H6V15.375Z" fill={color} /></svg>;
}
export default icn;