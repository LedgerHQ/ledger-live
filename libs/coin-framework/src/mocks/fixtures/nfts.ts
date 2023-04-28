import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  NFTStandard,
  Operation,
  ProtoNFT,
} from "@ledgerhq/types-live";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import Prando from "prando";
import { inferSubOperations } from "../../account";
import { genAddress, genHex } from "../helpers";
import { encodeNftId } from "../../nft/nftId";

const defaultEthCryptoFamily = cryptocurrenciesById["ethereum"];

export const NFTs = [
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xb1540922Be7c7Ed011cb41cc0Cc4adDf089b3AaF+7833",
    tokenId: "7833",
    amount: "1",
    collection: {
      contract: "0xb1540922Be7c7Ed011cb41cc0Cc4adDf089b3AaF",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xb1540922Be7c7Ed011cb41cc0Cc4adDf089b3AaF+2372",
    tokenId: "2372",
    amount: "1",
    collection: {
      contract: "0xb1540922Be7c7Ed011cb41cc0Cc4adDf089b3AaF",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x9191DFd6Ec2Ec31A7aaE86D89B44f94a70096194+203",
    tokenId: "203",
    amount: "1",
    collection: {
      contract: "0x9191DFd6Ec2Ec31A7aaE86D89B44f94a70096194",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x65498bF901A0C47ba9507C8a778d2bdee4Db12b4+4628",
    tokenId: "4628",
    amount: "1",
    collection: {
      contract: "0x65498bF901A0C47ba9507C8a778d2bdee4Db12b4",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x85ff6EC2BD7446C90F24F6a5e5acdD82Bcd2D4BE+4628",
    tokenId: "4628",
    amount: "1",
    collection: {
      contract: "0x85ff6EC2BD7446C90F24F6a5e5acdD82Bcd2D4BE",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x495f947276749Ce646f68AC8c248420045cb7b5e+15219551248750507857885240633851073364192113972571174309573660185104102719489",
    tokenId:
      "15219551248750507857885240633851073364192113972571174309573660185104102719489",
    amount: "1",
    collection: {
      contract: "0x495f947276749Ce646f68AC8c248420045cb7b5e",
      standard: "ERC1155",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x7A56a078da312bbfB5916CE118786f39cf6DF74f+323",
    tokenId: "323",
    amount: "1",
    collection: {
      contract: "0x7A56a078da312bbfB5916CE118786f39cf6DF74f",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x7A56a078da312bbfB5916CE118786f39cf6DF74f+711",
    tokenId: "711",
    amount: "1",
    collection: {
      contract: "0x7A56a078da312bbfB5916CE118786f39cf6DF74f",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xCa98FdF936243Edc3bbD65dc1dCc386Ec7a7d540+1203",
    tokenId: "1203",
    amount: "1",
    collection: {
      contract: "0xCa98FdF936243Edc3bbD65dc1dCc386Ec7a7d540",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xCa98FdF936243Edc3bbD65dc1dCc386Ec7a7d540+203",
    tokenId: "203",
    amount: "1",
    collection: {
      contract: "0xCa98FdF936243Edc3bbD65dc1dCc386Ec7a7d540",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xA04C6BD65E4352B30DCc6B0f21CF58aDEcc52781+16",
    tokenId: "16",
    amount: "1",
    collection: {
      contract: "0xA04C6BD65E4352B30DCc6B0f21CF58aDEcc52781",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xA35f12D3b934E21b9212e82f3CADdE20a0820352+5502",
    tokenId: "5502",
    amount: "1",
    collection: {
      contract: "0xA35f12D3b934E21b9212e82f3CADdE20a0820352",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x8e6da68d4a928e673b3A24014169515B293Ed5A4+19896",
    tokenId: "19896",
    amount: "1",
    collection: {
      contract: "0x8e6da68d4a928e673b3A24014169515B293Ed5A4",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x27fd9575a484E374B8e62B6738b5FbF415C9Be4E+112",
    tokenId: "112",
    amount: "1",
    collection: {
      contract: "0x27fd9575a484E374B8e62B6738b5FbF415C9Be4E",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x8e6da68d4a928e673b3A24014169515B293Ed5A4+13885",
    tokenId: "13885",
    amount: "1",
    collection: {
      contract: "0x8e6da68d4a928e673b3A24014169515B293Ed5A4",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x1447Cd4d3CE6C7FdB0da8d20450d92b08F7c4A54+1208",
    tokenId: "1208",
    amount: "1",
    collection: {
      contract: "0x1447Cd4d3CE6C7FdB0da8d20450d92b08F7c4A54",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xb1778D7Aa4a384757800D1429DfCae58dCD6DB42+1",
    tokenId: "1",
    amount: "1",
    collection: {
      contract: "0xb1778D7Aa4a384757800D1429DfCae58dCD6DB42",
      standard: "ERC1155",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xf61F24c2d93bF2dE187546B14425BF631F28d6dC+4628",
    tokenId: "4628",
    amount: "1",
    collection: {
      contract: "0xf61F24c2d93bF2dE187546B14425BF631F28d6dC",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x8e6da68d4a928e673b3A24014169515B293Ed5A4+11117",
    tokenId: "11117",
    amount: "1",
    collection: {
      contract: "0x8e6da68d4a928e673b3A24014169515B293Ed5A4",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x184c949436f6E4e8314dA3F4d78B2D38B0222823+3634",
    tokenId: "3634",
    amount: "1",
    collection: {
      contract: "0x184c949436f6E4e8314dA3F4d78B2D38B0222823",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x184c949436f6E4e8314dA3F4d78B2D38B0222823+1229",
    tokenId: "1229",
    amount: "1",
    collection: {
      contract: "0x184c949436f6E4e8314dA3F4d78B2D38B0222823",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x8e6da68d4a928e673b3A24014169515B293Ed5A4+2278",
    tokenId: "2278",
    amount: "1",
    collection: {
      contract: "0x8e6da68d4a928e673b3A24014169515B293Ed5A4",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x2963bA471e265e5F51cAfaFca78310FE87F8E6D1+6348",
    tokenId: "6348",
    amount: "1",
    collection: {
      contract: "0x2963bA471e265e5F51cAfaFca78310FE87F8E6D1",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xFBeef911Dc5821886e1dda71586d90eD28174B7d+76100",
    tokenId: "76100",
    amount: "1",
    collection: {
      contract: "0xFBeef911Dc5821886e1dda71586d90eD28174B7d",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xBEA73B677c2A8ec4d358a74ff5EC344F34a0d214+7281",
    tokenId: "7281",
    amount: "1",
    collection: {
      contract: "0xBEA73B677c2A8ec4d358a74ff5EC344F34a0d214",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xd929FB5B7357Ed59ba770af812eFC116f873C795+1",
    tokenId: "1",
    amount: "1",
    collection: {
      contract: "0xd929FB5B7357Ed59ba770af812eFC116f873C795",
      standard: "ERC1155",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xd1169e5349d1cB9941F3DCbA135C8A4b9eACFDDE+171000106229",
    tokenId: "171000106229",
    amount: "1",
    collection: {
      contract: "0xd1169e5349d1cB9941F3DCbA135C8A4b9eACFDDE",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x6315d09bc75eE00B767142C05265Eeb180765093+559",
    tokenId: "559",
    amount: "1",
    collection: {
      contract: "0x6315d09bc75eE00B767142C05265Eeb180765093",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xDDB149AE8E6635Df01a530da1E46921Bd78Dc385+1",
    tokenId: "1",
    amount: "1",
    collection: {
      contract: "0xDDB149AE8E6635Df01a530da1E46921Bd78Dc385",
      standard: "ERC1155",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B+9602000",
    tokenId: "9602000",
    amount: "1",
    collection: {
      contract: "0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B+9640021",
    tokenId: "9640021",
    amount: "1",
    collection: {
      contract: "0xABB3738f04Dc2Ec20f4AE4462c3d069d02AE045B",
      standard: "ERC721",
    },
  },
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270+282001002",
    tokenId: "282001002",
    amount: "1",
    collection: {
      contract: "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270",
      standard: "ERC721",
    },
  },
];

// Ethereum NFTs with the special "staxImage" metadata designed to fit the Ledger Stax screen
export const NFTs_ETHEREUM_STAX_METADATA = [
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0xf4ac11a8967bc88c9ce5acf886bce605c9db9d6e+8482",
    tokenId: "8482",
    amount: "1",
    collection: {
      contract: "0xf4ac11a8967bc88c9ce5acf886bce605c9db9d6e",
      standard: "ERC721",
    },
  },
];

export const NFTs_POLYGON = [
  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x68a0B29526f342de944BBd6bF61D9c644B96b771+7",
    tokenId: "7",
    amount: "1",
    collection: {
      contract: "0x68a0B29526f342de944BBd6bF61D9c644B96b771",
      standard: "ERC1155",
    },
  },

  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x68a0b29526f342de944bbd6bf61d9c644b96b771+4",
    tokenId: "4",
    amount: "1",
    collection: {
      contract: "0x68a0b29526f342de944bbd6bf61d9c644b96b771",
      standard: "ERC1155",
    },
  },

  {
    id: "js:2:ethereum:0xB98d10d9f6d07bA283bFD21B2dFEc050f9Ae282A:+0x68a0b29526f342de944bbd6bf61d9c644b96b771+3",
    tokenId: "3",
    amount: "1",
    collection: {
      contract: "0x68a0b29526f342de944bbd6bf61d9c644b96b771",
      standard: "ERC1155",
    },
  },
];
export function createFixtureNFT(
  accountId: string,
  currency: CryptoCurrency = defaultEthCryptoFamily,
  useStaxNFTs?: boolean
): ProtoNFT {
  const nfts =
    currency.id === "ethereum"
      ? useStaxNFTs
        ? NFTs_ETHEREUM_STAX_METADATA
        : NFTs
      : NFTs_POLYGON;
  const index = Math.floor(Math.random() * nfts.length);

  const nft = nfts[index];
  return {
    id: encodeNftId(
      accountId,
      nft.collection.contract,
      nft.tokenId,
      currency.id
    ),
    tokenId: nft.tokenId,
    amount: new BigNumber(0),
    contract: nft.collection.contract,
    standard: nft.collection.standard as NFTStandard,
    currencyId: currency.id,
    metadata: undefined,
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
  tokenId: string
): Operation {
  const ticker =
    account.type === "TokenAccount"
      ? account.token.ticker
      : account.currency.ticker;
  const lastOp = ops[ops.length - 1];
  const date = new Date(
    (lastOp ? lastOp.date : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next())
  );
  const address = genAddress(superAccount.currency, rng);
  const type = rng.next() < 0.3 ? "NFT_OUT" : "NFT_IN";
  const divider = 2;
  const value = new BigNumber(
    Math.floor(rng.nextInt(0, 100000 * rng.next() * rng.next()) / divider)
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
    senders: [
      type !== "NFT_IN" ? genAddress(superAccount.currency, rng) : address,
    ],
    recipients: [
      type === "NFT_IN" ? genAddress(superAccount.currency, rng) : address,
    ],
    blockHash: genHex(64, rng),
    blockHeight:
      superAccount.blockHeight -
      Math.floor((Date.now() - (date as any)) / 900000),
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
