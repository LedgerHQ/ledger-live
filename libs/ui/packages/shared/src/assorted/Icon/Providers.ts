import { CDN_URL } from "@ledgerhq/ui-shared";

export const ALL_PROVIDERS = [
  "aave",
  "baanx",
  "banxa",
  "binance",
  "bitrefill",
  "btcdirect",
  "changelly",
  "cic",
  "coingecko",
  "coinify",
  "compound",
  "deversifi",
  "ftx",
  "ftxus",
  "kiln",
  "lido",
  "loopipay",
  "mercuryo",
  "moonpay",
  "oneinch",
  "opensea",
  "pancakeswap",
  "paraswap",
  "poap",
  "rainbowme",
  "ramp",
  "rarible",
  "simplex",
  "sushiswap",
  "transak",
  "wyre",
  "zerion",
] as const;

export type Provider = (typeof ALL_PROVIDERS)[number];

export const isProviderIconName = (name: string): name is Provider =>
  ALL_PROVIDERS.some((item) => item === name);

type GetProviderIconUrlProps = {
  cdn?: string;
  name: Provider;
  boxed: boolean;
};

export const getProviderIconUrl = ({
  cdn = CDN_URL,
  name,
  boxed,
}: GetProviderIconUrlProps) => {
  const iconType = boxed ? "boxed" : "default";
  return `${cdn}/icons/providers/${iconType}/${name}.svg`;
};