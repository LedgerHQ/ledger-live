import * as React from "react";
import Svg from "./StyledSvg";
type Props = {
  size?: number | string;
  color?: string;
};

function WifiNoneMedium({
  size = 16,
  color = "currentColor"
}: Props): JSX.Element {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M19.344 21.432l1.272-1.272L7.872 7.416l-1.536-1.56-3.312-3.288L1.752 3.84l2.856 2.856A15.764 15.764 0 001.68 8.88l1.416 1.464A13.2 13.2 0 016.072 8.16l2.304 2.304a10.42 10.42 0 00-3.384 1.992l1.344 1.536c1.104-.96 2.28-1.608 3.648-1.92l3 3a4.417 4.417 0 00-.984-.096 5.461 5.461 0 00-3.576 1.32L12 20.232l2.904-3.24 4.44 4.44zM8.376 5.184l1.704 1.704a16.49 16.49 0 011.92-.12c3.624 0 6.576 1.344 8.904 3.576L22.32 8.88A14.955 14.955 0 0012 4.728a14.99 14.99 0 00-3.624.456zm4.68 4.68l2.952 2.976a9.34 9.34 0 011.656 1.152l1.344-1.536a10.851 10.851 0 00-5.952-2.592z"  /></Svg>;
}

export default WifiNoneMedium;