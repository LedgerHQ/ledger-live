import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { Operation, ProtoNFT } from "@ledgerhq/types-live";
import { decodeAccountId } from "../account";
import { encodeNftId } from "./nftId";

export const nftsFromOperations = (ops: Operation[]): ProtoNFT[] => {
  const nftsMap = ops
    .slice(0)
    // make sure we have the operation in chronological order (older first)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    // if ops are Operations get the prop nftOperations, else ops are considered nftOperations already
    .flatMap(op => (op?.nftOperations?.length ? op.nftOperations : op))
    .reduce((acc: Record<string, ProtoNFT>, nftOp: Operation) => {
      let { contract } = nftOp;
      if (!contract) {
        return acc;
      }

      // Creating a "token for a contract" unique key
      contract = eip55.encode(contract);
      const { tokenId, standard, accountId } = nftOp;
      const { currencyId } = decodeAccountId(nftOp.accountId);
      if (!tokenId || !standard) return acc;
      const id = encodeNftId(accountId, contract, tokenId, currencyId);

      const nft = (acc[id] || {
        id,
        tokenId,
        amount: new BigNumber(0),
        contract,
        standard,
        currencyId,
      }) as ProtoNFT;

      if (nftOp.type === "NFT_IN") {
        nft.amount = nft.amount.plus(nftOp.value);
      } else if (nftOp.type === "NFT_OUT") {
        const newAmount = nft.amount.minus(nftOp.value);

        // In case of OpenSea lazy minting feature (minting an NFT off-chain)
        // OpenSea will fire a false ERC1155 event saying that you sent an NFT
        // from your account that you never received first.
        //
        // E.g.: I'm creating 10 ERC1155 on OpenSea. It's not going to create anything on-chain.
        // Then I (bob) decide to transfer 5 to someone (kvn). OpenSea is going to mint the NFT in its
        // collection (`OpenSea Shared Storefront` / `OpenSea Collections`) and transfer it to kvn.
        // But the event fired by the Smart Contract is going to be `bob transfered 5 NFT to kvn` which is false.
        // It would then result in bob have -5 NFTs since he never received them first.
        // If kvn send 2 back to bob, based on the events we would think that bob has -3 NFTs.
        //
        // To mitigate that we put a minimum value of 0 when an account is transferring some NFTs.
        nft.amount = newAmount.isNegative() ? new BigNumber(0) : newAmount;
      }

      acc[id] = nft;

      return acc;
    }, {});

  // We reverse the array to make it from latest to oldest again
  return Object.values(nftsMap).reverse();
};
