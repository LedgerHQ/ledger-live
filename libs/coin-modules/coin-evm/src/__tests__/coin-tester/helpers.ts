import { ethers } from "ethers";
import { NFTStandard } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import ERC1155ABI from "../../abis/erc1155.abi.json";
import ERC721ABI from "../../abis/erc721.abi.json";
import ERC20ABI from "../../abis/erc20.abi.json";

export const ethereum = getCryptoCurrencyById("ethereum");
export const polygon = getCryptoCurrencyById("polygon");
export const scroll = getCryptoCurrencyById("scroll");
export const blast = getCryptoCurrencyById("blast");
export const ERC20Interface = new ethers.utils.Interface(ERC20ABI);
export const ERC721Interface = new ethers.utils.Interface(ERC721ABI);
export const ERC1155Interface = new ethers.utils.Interface(ERC1155ABI);
export const VITALIK = "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9";

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
  await provider.send("anvil_setBalance", [
    addressToImpersonnate,
    ethers.utils.parseEther("10").toHexString(),
  ]);
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

export type Drug =
  | TokenCurrency
  | { type: "Nft"; tokenId: string; contractAddress: string; standard: NFTStandard };

const DEALER = "0x00000000000000000000000000000000deadbeef";
// Don't use the first byte, it is used by Circle on USDC to get blacklisted people
const stash = "0x00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
/**
 * Helper providing any token/NFT in any quantity to any address
 */
export const callMyDealer = async ({
  provider,
  drug,
  junkie,
  dose,
}: {
  provider: ethers.providers.JsonRpcProvider;
  drug: Drug;
  junkie: string;
  dose: ethers.BigNumber;
}) => {
  const { contractAddress } = drug;

  const balanceOfCalldata =
    drug.type === "TokenCurrency"
      ? ERC20Interface.encodeFunctionData("balanceOf", [DEALER])
      : drug.standard === "ERC721"
        ? ERC721Interface.encodeFunctionData("ownerOf", [drug.tokenId])
        : ERC1155Interface.encodeFunctionData("balanceOf", [DEALER, drug.tokenId]);
  const expectedSlotValue =
    drug.type === "Nft" && drug.standard === "ERC721"
      ? ethers.utils.hexZeroPad(DEALER, 32)
      : ethers.utils.hexZeroPad(stash, 32);

  // Get a list of all storage slots accessed when requesting the balance of the dealer
  const { accessList }: { accessList: { address: string; storageKeys: string[] }[] } =
    await provider.send("eth_createAccessList", [
      {
        to: contractAddress,
        data: balanceOfCalldata,
      },
    ]);

  let dealerGotDelivered = false;
  for (const { address, storageKeys } of accessList) {
    if (address.toLowerCase() !== contractAddress.toLowerCase()) continue;

    // For all the slots accessed, we try to request the `balanceOf` of the dealer while overriding its value
    for (const slot of storageKeys) {
      const overriddenStorageSlot = {
        [contractAddress]: {
          stateDiff: {
            [slot]: expectedSlotValue,
          },
        },
      };
      const newSlotValue = await provider
        .send("eth_call", [
          {
            to: contractAddress,
            data: balanceOfCalldata,
          },
          "latest",
          overriddenStorageSlot,
        ])
        .catch(() => "0x");

      // If the balance is still 0, it means the slot was not the one containing the dealer's balance
      if (newSlotValue !== expectedSlotValue) continue;

      // We found the right slot, we can now override the dealer's balance in the contract state
      await provider.send("anvil_setStorageAt", [contractAddress, slot, expectedSlotValue]);
      dealerGotDelivered = true;
      break;
    }
  }
  if (!dealerGotDelivered) throw new Error("Deal failed for some reason");

  // We can now impersonate the dealer and send the tokens to the junkie
  // This will trigger the ERCXXX transfer function and transfer events
  // which we will be able to index and mock explorers with those
  await impersonnateAccount({
    provider,
    addressToImpersonnate: DEALER,
    to: contractAddress,
    data:
      drug.type === "TokenCurrency"
        ? ERC20Interface.encodeFunctionData("transfer", [junkie, dose.toHexString()])
        : drug.standard === "ERC721"
          ? ERC721Interface.encodeFunctionData("safeTransferFrom(address,address,uint256)", [
              DEALER,
              junkie,
              drug.tokenId,
            ])
          : ERC1155Interface.encodeFunctionData(
              "safeTransferFrom(address,address,uint256,uint256,bytes)",
              [DEALER, junkie, drug.tokenId, dose.toHexString(), "0x"],
            ),
  });
};
