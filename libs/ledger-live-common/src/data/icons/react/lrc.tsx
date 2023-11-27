
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function lrc({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M12 4.5L18.75 13.8998L12 19.5L5.25 13.8998L12 4.5ZM11.1195 9.50025L8.18475 13.5L11.1195 15.9V9.50025ZM12.8805 9.50025V15.9L15.8153 13.5L12.8805 9.50025Z" fill={color} /></svg>;
}
export default lrc;