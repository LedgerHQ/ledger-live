import BigNumber from "bignumber.js";
import { hashes as localTokensHashesByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeOperation } from "./common.fixtures";

export const currency = getCryptoCurrencyById("scroll_sepolia");
export const fakeToken: ERC20Token = [
  currency.id, // parent currency id
  "new_token_mock", // token id
  "NTM", // ticker
  18, // precision
  "Awesome Fake Token", // name
  "dadcoffee", // ledgerSignature
  "0xdeadbeef", // contract address
  false, // [deprecated] disabled counter values
  false, // delisted
];

export const localCALHash =
  localTokensHashesByChainId[
    currency.ethereumLikeInfo!.chainId as keyof typeof localTokensHashesByChainId
  ];
export const getAccountShapeParameters: AccountShapeInfo = {
  address: "0xkvn",
  currency,
  derivationMode: "",
  derivationPath: "44'/60'/0'/0/0",
  index: 0,
};
export const TMUSDTTransaction = makeOperation({
  hash: "anyHash",
  accountId:
    "js:2:scroll_sepolia:0xkvn:+scroll~!underscore!~sepolia%2Ferc20%2Fmock~!underscore!~usdt",
  blockHash: "0x95dc138a02c1b0e3fd49305f785e8e27e88a885004af13a9b4c62ad94eed07dd",
  recipients: ["0xB0B"],
  senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
  contract: "0x389942E33440c00869B68d66f18335BF11974B87",
  value: new BigNumber(0),
  fee: new BigNumber(0),
  type: "OUT",
  date: new Date(),
  blockHeight: 10,
});
export const NTMTransaction = makeOperation({
  hash: "anyOtherHash",
  accountId:
    "js:2:scroll_sepolia:0xkvn:+scroll~!underscore!~sepolia%2Ferc20%2Fnew~!underscore!~token~!underscore!~mock",
  blockHash: "0x1234",
  recipients: ["0xB0B"],
  senders: ["0x9b744C0451D73C0958d8aA566dAd33022E4Ee797"], // sbf.eth
  contract: fakeToken[6],
  value: new BigNumber(0),
  fee: new BigNumber(0),
  type: "OUT",
  date: new Date(),
  blockHeight: 10,
});
