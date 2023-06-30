import React from "react";
import Svg, { Path } from "react-native-svg";
import { getFTXLogo } from "./FTX";
import { Changelly } from "./Changelly";
import { Cic } from "./Cic";
import { Oneinch } from "./Oneinch";
import { Paraswap } from "./Paraswap";
import { Wyre } from "./Wyre";

export const providerIcons: Record<string, React.FC<{ size: number }>> = {
  changelly: React.memo(Changelly),
  cic: React.memo(Cic),
  ftx: getFTXLogo(),
  ftxus: getFTXLogo(true),
  oneinch: React.memo(Oneinch),
  paraswap: React.memo(Paraswap),
  wyre: React.memo(Wyre),
};

export const SwapIcon = React.memo(({ size = 16, color }: { size: number; color: string }) => (
  <Svg viewBox="0 0 16 16" width={size} height={size}>
    <Path
      fill={color}
      d="M2.775 4.525V6.75a.75.75 0 1 1-1.5 0V3.775a.75.75 0 0 1 .75-.75h11.9a.75.75 0 1 1 0 1.5H2.775zm8.349-2.624a.75.75 0 0 1 1.06-1.06l2.405 2.404a.75.75 0 0 1 0 1.06L12.184 6.71a.75.75 0 0 1-1.06-1.06l1.874-1.874-1.874-1.874zm2.051 9.624V9.3a.75.75 0 0 1 1.5 0v2.975a.75.75 0 0 1-.75.75h-11.9a.75.75 0 1 1 0-1.5h11.15zm-10.223.75l1.874 1.874a.75.75 0 0 1-1.06 1.06L1.36 12.805a.75.75 0 0 1 0-1.06L3.766 9.34a.75.75 0 0 1 1.06 1.06l-1.874 1.874z"
    />
  </Svg>
));
