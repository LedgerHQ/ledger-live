
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function vib({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6.375 5.25H9.525L14.925 14.8312V5.25H17.625V18.75H14.025L6.375 5.25Z" fill={color} /></svg>;
}
export default vib;