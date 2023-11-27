
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function dgd({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M9.375 8.25V10.5H4.125V8.25H9.375ZM10.125 8.25H11.625V15.75H4.125V11.25H10.125V8.25ZM5.625 12.75V14.25H10.125V12.75H5.625ZM19.875 9.75H13.875V14.25H18.375V12.75H15.375V11.25H19.875V15.75H12.375V8.25H19.875V9.75Z" fill={color} /></svg>;
}
export default dgd;