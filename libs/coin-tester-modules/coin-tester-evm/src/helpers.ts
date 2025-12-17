import type Transport from "@ledgerhq/hw-transport";
import { ethers } from "ethers";
import { AccountBridge, CurrencyBridge, NFTStandard } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI } from "@ledgerhq/coin-evm/abis/index";
import { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/transaction";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import resolver from "@ledgerhq/coin-evm/hw-getAddress";
import { Signer, createSigner } from "@ledgerhq/live-common/bridge/generic-alpaca/signer/Eth";
import { getAlpacaCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-alpaca/currencyBridge";
import { getAlpacaAccountBridge } from "@ledgerhq/live-common/bridge/generic-alpaca/accountBridge";

export const ethereum = getCryptoCurrencyById("ethereum");
export const core = getCryptoCurrencyById("core");
export const sonic = getCryptoCurrencyById("sonic");
export const polygon = getCryptoCurrencyById("polygon");
export const scroll = getCryptoCurrencyById("scroll");
export const blast = getCryptoCurrencyById("blast");
export const ERC20Interface = new ethers.Interface(ERC20_ABI);
export const ERC721Interface = new ethers.Interface(ERC721_ABI);
export const ERC1155Interface = new ethers.Interface(ERC1155_ABI);
export const VITALIK = "0x6bfD74C0996F269Bcece59191EFf667b3dFD73b9";

export function getBridges(
  transport: Transport,
  network: string,
): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<EvmTransaction>;
  getAddress: GetAddressFn;
} {
  const context: SignerContext<Signer> = (_, fn) => fn(createSigner(transport));
  const getAddress = resolver(context);

  return {
    currencyBridge: getAlpacaCurrencyBridge(network, "local", { context, getAddress }),
    accountBridge: getAlpacaAccountBridge(network, "local", { context, getAddress }),
    getAddress,
  };
}

export const impersonnateAccount = async ({
  provider,
  addressToImpersonnate,
  to,
  data,
}: {
  provider: ethers.JsonRpcProvider;
  addressToImpersonnate: string;
  to: string;
  data: string;
}) => {
  await provider.send("anvil_setBalance", [
    addressToImpersonnate,
    ethers.toBeHex(ethers.parseEther("10")),
  ]);
  await provider.send("anvil_impersonateAccount", [addressToImpersonnate]);
  const feeData = await provider.getFeeData();
  const impersonatedAccount = {
    from: addressToImpersonnate,
    to,
    data,
    value: ethers.toBeHex(0n),
    gas: ethers.toBeHex(1_000_000n),
    type: "0x0",
    gasPrice: feeData.gasPrice ? ethers.toBeHex(feeData.gasPrice) : "0x0",
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
  provider: ethers.JsonRpcProvider;
  drug: Drug;
  junkie: string;
  dose: bigint;
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
      ? ethers.zeroPadValue(DEALER, 32)
      : ethers.zeroPadValue(stash, 32);

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
        ? ERC20Interface.encodeFunctionData("transfer", [junkie, ethers.toBeHex(dose)])
        : drug.standard === "ERC721"
          ? ERC721Interface.encodeFunctionData("safeTransferFrom(address,address,uint256)", [
              DEALER,
              junkie,
              drug.tokenId,
            ])
          : ERC1155Interface.encodeFunctionData(
              "safeTransferFrom(address,address,uint256,uint256,bytes)",
              [DEALER, junkie, drug.tokenId, ethers.toBeHex(dose), "0x"],
            ),
  });
};
