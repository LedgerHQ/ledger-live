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
<<<<<<< HEAD

export const impersonnateAccount = async ({
  provider,
  addressToImpersonnate,
  to,
  data,
}: {
  provider: ethers.providers.JsonRpcProvider;
  addressToImpersonnate: string;
  to: string;
  data: string;
}) => {
  await provider.send("anvil_impersonateAccount", [addressToImpersonnate]);
  const impersonatedAccount = {
    from: addressToImpersonnate,
    to,
    data,
    value: ethers.BigNumber.from(0).toHexString(),
    gas: ethers.BigNumber.from(1_000_000).toHexString(),
    type: "0x0",
    gasPrice: (await provider.getGasPrice()).toHexString(),
    nonce: "0x" + (await provider.getTransactionCount(addressToImpersonnate)).toString(16),
    chainId: "0x" + (await provider.getNetwork()).chainId.toString(16),
  };

  const hash = await provider.send("eth_sendTransaction", [impersonatedAccount]);
  await provider.send("anvil_stopImpersonatingAccount", [addressToImpersonnate]);
  await provider.waitForTransaction(hash);
};
=======
>>>>>>> 1277428a21 (coin-evm coin-tester implementation)
