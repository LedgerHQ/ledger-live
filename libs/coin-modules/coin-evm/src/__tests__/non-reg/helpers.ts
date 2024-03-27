import { ethers, providers } from "ethers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import ERC20ABI from "./abis/erc20.json";

// TODO: should be moved in setup, needed in indexer.ts for now
export const provider = new providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
export const ethereum = getCryptoCurrencyById("ethereum");
export const polygon = getCryptoCurrencyById("polygon");
export const ERC20Interface = new ethers.utils.Interface(ERC20ABI);
export const USDC_ON_ETHEREUM = getTokenById("ethereum/erc20/usd__coin");
export const USDC_ON_POLYGON = getTokenById("polygon/erc20/usd_coin_(pos)");
