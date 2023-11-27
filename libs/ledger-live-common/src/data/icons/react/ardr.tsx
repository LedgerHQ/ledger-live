
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function ardr({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M11.9123 14.0175L13.239 15.7515L9.375 18.375L11.9123 14.0175ZM12 5.625L14.0452 8.9805L8.59125 18.375H4.5L12 5.625ZM12 13.0065L14.727 10.9935L19.5 18.375H16.0912L12 13.0065Z" fill={color} /></svg>;
}
export default ardr;