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
import {
  NFTs_ETHEREUM_STAX_METADATA,
  NFTs,
  NFTs_POLYGON,
  NFTs_ARBITRUM,
  NFTs_BASE,
  NFTs_SOLANA,
  NFTs_OPTIMISM,
} from "./nftsSamples";

const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];

const MAX_SUPPLY = 1000;

const getNFTsForCurrency = (currencyId: string, useStaxNFTs?: boolean) => {
  switch (currencyId) {
    case "ethereum":
      return useStaxNFTs ? NFTs_ETHEREUM_STAX_METADATA : NFTs;
    case "polygon":
      return NFTs_POLYGON;
    case "arbitrum":
      return NFTs_ARBITRUM;
    case "base":
      return NFTs_BASE;
    case "solana":
      return NFTs_SOLANA;
    case "optimism":
      return NFTs_OPTIMISM;
    default:
      return NFTs;
  }
};

export function createFixtureNFT(
  accountId: string,
  currency: CryptoCurrency = defaultEthCryptoFamily,
  useStaxNFTs?: boolean,
): ProtoNFT {
  const nfts = getNFTsForCurrency(currency.id, useStaxNFTs);

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
