import { ethers } from "ethers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import ERC20ABI from "../../abis/erc20.abi.json";
import ERC721ABI from "../../abis/erc721.abi.json";
import ERC1155ABI from "../../abis/erc1155.abi.json";

export const ethereum = getCryptoCurrencyById("ethereum");
export const polygon = getCryptoCurrencyById("polygon");
export const ERC20Interface = new ethers.utils.Interface(ERC20ABI);
export const ERC721Interface = new ethers.utils.Interface(ERC721ABI);
export const ERC1155Interface = new ethers.utils.Interface(ERC1155ABI);
export const USDC_ON_ETHEREUM = getTokenById("ethereum/erc20/usd__coin");
export const USDC_ON_POLYGON = getTokenById("polygon/erc20/usd_coin_(pos)");
