
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function eop({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M11.0355 21L7.02454 10.3027L5.40454 17.6827L11.0355 21ZM12.09 3.12823L7.69279 8.47724L12.09 19.7145L16.5128 8.47724L12.09 3.12823ZM13.17 21L17.1818 10.3027L18.7755 17.6827L13.17 21Z" fill={color} /><path d="M10.9455 20.9359L6.93451 10.2386L5.31451 17.6186L10.9455 20.9359ZM12 3.06415L7.60276 8.41315L12 19.6504L16.4228 8.41315L12 3.06415ZM13.08 20.9359L17.0918 10.2386L18.6855 17.6186L13.08 20.9359Z" fill={color} /></svg>;
}
export default eop;