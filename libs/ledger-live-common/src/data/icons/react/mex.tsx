
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function mex({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" enableBackground="new 0 0 24 24" xmlSpace="preserve"><path fillRule="evenodd" clipRule="evenodd" fill={color} d="M17.6,10.3L10.3,20l1.3-6.3H6.4L13.7,4l-1.4,6.3H17.6z" /></svg>;
}
export default mex;