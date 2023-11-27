
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function kava({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} strokeMiterlimit={10} viewBox="0 0 24 24" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M7.91997 4.18036L7.91997 19.8176L7.91997 19.8176L5.19413 19.8176L5.19413 19.8176L5.19413 4.18036L5.19413 4.18036L7.91997 4.18036L7.91997 4.18036Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /><path d="M15.3843 19.8197L9.40414 11.9988L15.3843 4.18237L18.8059 4.18237L12.9094 11.9988L18.8059 19.8197L15.3843 19.8197Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /></svg>;
}
export default kava;