
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function vlx({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} strokeMiterlimit={10} viewBox="0 0 24 24" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M15.3835 10.0494L12.0049 15.9012L8.61652 10.0494L15.3835 10.0494ZM18.7675 8.09447L5.23251 8.09447L12.0049 19.8024L18.7675 8.09882L18.7675 8.09447ZM2.9765 4.19762L4.10451 6.15256L19.8955 6.15256L21.0235 4.19762L2.9765 4.19762Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /></svg>;
}
export default vlx;