import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  NFTMetadata,
  NFTStandard,
  Operation,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import Prando from "prando";
import { inferSubOperations } from "../../serialization";
import { genAddress, genHex } from "../helpers";
import { encodeNftId } from "../../nft/nftId";

const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];

const MAX_SUPPLY = 1000;

export const NFTs = [
  {
    id: "Pudgy Penguin",
    collection: {
      contract: "0xbd3531da5cf5857e7cfaa92426877b022e612cf8",
      standard: "ERC721",
    },
  },
  {
    id: "Kanpai Panda",
    collection: {
      contract: "0xacf63e56fd08970b43401492a02f6f38b6635c91",
      standard: "ERC721",
    },
  },
  {
    id: "Bored Ape Yacht Club",
    collection: {
      contract: "0xacf63e56fd08970b43401492a02f6f38b6635c91",
      standard: "ERC721",
    },
  },
  {
    id: "Imaginary Ones",
    collection: {
      contract: "0x716f29b8972d551294d9e02b3eb0fc1107fbf4aa",
      standard: "ERC721",
    },
  },
];

// Ethereum NFTs with the special "staxImage" metadata designed to fit the Ledger Stax screen
export const NFTs_ETHEREUM_STAX_METADATA = [
  {
    id: "Inspired By Ledger",
    collection: {
      contract: "0x0b51eb9d0e54c562fedc07ceba453f05b70c4b79",
      standard: "ERC1155",
    },
  },
];

export const NFTs_POLYGON = [
  {
    id: "Crypto Unicorns Market",
    collection: {
      contract: "0xdc0479cc5bba033b3e7de9f178607150b3abce1f",
      standard: "ERC721",
    },
  },
  {
    id: "Chicken Derby",
    collection: {
      contract: "0x8634666ba15ada4bbc83b9dbf285f73d9e46e4c2",
      standard: "ERC721",
    },
  },
  {
    id: "y00ts",
    collection: {
      contract: "0x670fd103b1a08628e9557cd66b87ded841115190",
      standard: "ERC721",
    },
  },
];

export function createFixtureNFT(
  accountId: string,
  currency: CryptoCurrency = defaultEthCryptoFamily,
  useStaxNFTs?: boolean,
): ProtoNFT {
  const nfts =
    currency.id === "ethereum" ? (useStaxNFTs ? NFTs_ETHEREUM_STAX_METADATA : NFTs) : NFTs_POLYGON;
  const index = Math.floor(Math.random() * nfts.length);
  const tokenId = useStaxNFTs ? String(13) : String(Math.floor(Math.random() * MAX_SUPPLY) + 1);
  const nft = nfts[index];

  return {
    id: encodeNftId(accountId, nft.collection.contract, tokenId, currency.id),
    tokenId: tokenId,
    amount: new BigNumber(0),
    contract: nft.collection.contract,
    standard: nft.collection.standard as NFTStandard,
    currencyId: currency.id,
    metadata: useStaxNFTs
      ? ({ staxImage: "https://example.com/image.png" } as NFTMetadata)
      : undefined,
  };
}

/**
 * @memberof mock/account
 */
export function genNFTOperation(
  superAccount: Account,
  account: AccountLike,
  ops: any,
  rng: Prando,
  contract: string,
  standard: NFTStandard,
  tokenId: string,
): Operation {
  const ticker = account.type === "TokenAccount" ? account.token.ticker : account.currency.ticker;
  const lastOp = ops[ops.length - 1];
  const date = new Date(
    (lastOp ? lastOp.date : Date.now()) - rng.nextInt(0, 100000000 * rng.next() * rng.next()),
  );
  const address = genAddress(superAccount.currency, rng);
  const type = rng.next() < 0.3 ? "NFT_OUT" : "NFT_IN";
  const divider = 2;
  const value = new BigNumber(
    Math.floor(rng.nextInt(0, 100000 * rng.next() * rng.next()) / divider),
  );

  if (Number.isNaN(value)) {
    throw new Error("invalid amount generated for " + ticker);
  }

  const hash = genHex(64, rng);
  const op: Operation = {
    id: String(`mock_op_${ops.length}_${account.id}`),
    hash,
    type,
    value,
    fee: new BigNumber(Math.round(value.toNumber() * 0.01)),
    senders: [type !== "NFT_IN" ? genAddress(superAccount.currency, rng) : address],
    recipients: [type === "NFT_IN" ? genAddress(superAccount.currency, rng) : address],
    blockHash: genHex(64, rng),
    blockHeight: superAccount.blockHeight - Math.floor((Date.now() - (date as any)) / 900000),
    accountId: account.id,
    date,
    extra: {},
    contract,
    standard,
    tokenId,
  };

  if (account.type === "Account") {
    const { subAccounts } = account;

    if (subAccounts) {
      // TODO make sure tokenAccounts sometimes reuse an existing op hash from main account
      op.subOperations = inferSubOperations(hash, subAccounts);
    }
  }

  return op;
}
