
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function sol({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24"><path fill={color} d="M2.41,7.77H18.09a.51.51,0,0,0,.37-.16l3.43-3.67a.4.4,0,0,0-.3-.67H5.91a.51.51,0,0,0-.37.16L2.11,7.1A.4.4,0,0,0,2.41,7.77Z" /><path fill={color} d="M2.41,20.77H18.09a.51.51,0,0,0,.37-.16l3.43-3.67a.4.4,0,0,0-.3-.67H5.91a.51.51,0,0,0-.37.16L2.11,20.1A.4.4,0,0,0,2.41,20.77Z" /><path fill={color} d="M21.59,14.27H5.91a.51.51,0,0,1-.37-.16L2.11,10.44a.4.4,0,0,1,.3-.67H18.09a.51.51,0,0,1,.37.16l3.43,3.67A.4.4,0,0,1,21.59,14.27Z" /></svg>;
}
export default sol;