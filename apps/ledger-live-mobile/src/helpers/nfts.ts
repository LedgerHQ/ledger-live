import { Account, ProtoNFT } from "@ledgerhq/types-live";

const GENESIS_PASS_COLLECTION_CONTRACT =
  "0x33c6Eec1723B12c46732f7AB41398DE45641Fa42";
const INFINITY_PASS_COLLECTION_CONTRACT =
  "0xfe399E9a4B0bE4087a701fF0B1c89dABe7ce5425";

const hasNftInAccounts = (nftCollection: string, accounts: Account[]) =>
  accounts &&
  accounts.some(account =>
    account?.nfts?.some((nft: ProtoNFT) => nft?.contract === nftCollection),
  );

export {
  GENESIS_PASS_COLLECTION_CONTRACT,
  INFINITY_PASS_COLLECTION_CONTRACT,
  hasNftInAccounts,
};
