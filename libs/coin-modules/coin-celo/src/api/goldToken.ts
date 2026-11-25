import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import { CELO_ERC20_ADDRESS } from "../constants";

const celoErc20Address = CELO_ERC20_ADDRESS.toLowerCase();

export const isGoldToken = (asset: AssetInfo): boolean =>
  "assetReference" in asset && asset.assetReference?.toLowerCase() === celoErc20Address;
