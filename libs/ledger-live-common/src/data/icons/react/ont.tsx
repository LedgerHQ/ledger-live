
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function ont({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M18.75 18.1627L7.48275 7.14066C8.73069 5.92326 10.4066 5.24433 12.15 5.24991C15.795 5.24991 18.75 8.14041 18.75 11.7067V18.1627ZM5.25 5.83716L16.5173 16.8592C15.2693 18.0766 13.5934 18.7555 11.85 18.7499C8.205 18.7499 5.25 15.8594 5.25 12.2932V5.83716Z" fill={color} /></svg>;
}
export default ont;