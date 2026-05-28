import { MaestroContext } from "../context";
import { runAddAccountSpec } from "./addAccount";
import { runSwapEthUsdtSpec } from "./swapEthUsdt";

export type SpecName = keyof typeof specs;

export type SpecRunner = (ctx: MaestroContext) => Promise<void>;

export const specs = {
  addAccount: runAddAccountSpec,
  swapEthUsdt: runSwapEthUsdtSpec,
} satisfies Record<string, SpecRunner>;
