
      // @ts-nocheck

      import * as React from "react";
interface Props {
            size: number;
            color?: string;
          };
function currencyBase({size, color = "currentColor"}: Props) {
  return <svg width={size} height={size} strokeMiterlimit={10} viewBox="0 0 24 24" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"><path d="M21.467 12C21.467 17.2268 17.2211 21.4641 11.9835 21.4641C7.01436 21.4641 2.93787 17.6501 2.53301 12.7955L15.068 12.7955L15.068 11.2045L2.53301 11.2045C2.93787 6.34988 7.01436 2.53593 11.9835 2.53593C17.2211 2.53593 21.467 6.77313 21.467 12Z" fill={color} fillRule="nonzero" opacity={1} stroke="none" /></svg>;
}
export default currencyBase;