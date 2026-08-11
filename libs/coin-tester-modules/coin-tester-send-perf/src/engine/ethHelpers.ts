import { ethers } from "ethers";
import { ANVIL_RPC } from "./layer1Runner";

export { ANVIL_RPC };

export async function walletFromMnemonic(
  provider: ethers.JsonRpcProvider,
  index = 0,
): Promise<ethers.HDNodeWallet> {
  const seed = process.env.SEED;
  if (!seed) {
    throw new Error("SEED env var required");
  }

  const path = `m/44'/60'/0'/0/${index}`;
  const wallet = ethers.HDNodeWallet.fromPhrase(seed, path).connect(provider);
  await provider.send("anvil_setBalance", [wallet.address, ethers.toBeHex(ethers.parseEther("100"))]);
  return wallet;
}
