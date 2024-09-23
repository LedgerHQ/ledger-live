import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../../types";

// Define the mock base URL for the Kadena API
export const API_KADENA_ENDPOINT = "https://estats.testnet.chainweb.com";

export const operation: Operation = {
  accountId: "js:2:kadena:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375:",
  blockHash: null,
  blockHeight: null,
  date: new Date(),
  extra: { receiverChainId: 0, senderChainId: 0 },
  fee: BigNumber(0),
  hash: "KO2yCnx3VuKWHqvRRsa8TumzjTjsE57ENV8bOFxMLRE",
  id: "js:2:kadena:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375:-KO2yCnx3VuKWHqvRRsa8TumzjTjsE57ENV8bOFxMLRE-OUT",
  recipients: ["k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76"],
  senders: ["k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375"],
  type: "OUT",
  value: BigNumber(0),
};

export const rawData = {
  pact_command: {
    cmd: '{"payload":{"exec":{"code":"(coin.transfer \\"k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375\\" \\"k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76\\" 0.25)","data":{}}},"nonce":"kjs:nonce:1724949787853","signers":[{"pubKey":"77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375","scheme":"ED25519","clist":[{"name":"coin.GAS","args":[]},{"name":"coin.TRANSFER","args":["k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375","k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76",{"decimal":"0.25"}]}]}],"meta":{"gasLimit":2300,"gasPrice":0.000001,"sender":"k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375","ttl":1200,"creationTime":1724949787,"chainId":"0"},"networkId":"testnet04"}',
    hash: "KO2yCnx3VuKWHqvRRsa8TumzjTjsE57ENV8bOFxMLRE",
    sigs: [
      {
        sig: "697dbe6011dae65986b2996cae487c3d7b0dbe1fd878795276…6857944982b46e9abc86f30e5bdc317d4052a4e141201780e",
      },
    ],
  },
};

export const mockAddress = "k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375";
export const mockAccountId =
  "js:2:kadena:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375:";

export const account = {
  balance: BigNumber(0),
  blockHeight: 4575073,
  creationDate: new Date(),
  currency: getCryptoCurrencyById("kadena"),
  derivationMode: "",
  feesCurrency: undefined,
  freshAddress: mockAddress,
  freshAddressPath: "44'/626'/1'/0/0",
  id: mockAccountId,
  index: 1,
  type: "Account",
} as Account;

export const transaction = {
  amount: BigNumber(50),
  family: "kadena",
  gasLimit: BigNumber(10),
  gasPrice: BigNumber(1000),
  receiverChainId: 0,
  recipient: "k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76",
  senderChainId: 0,
  useAllAmount: false,
} as Transaction;

export const coinDetailsForAccount = { "0": "45.759916781498" };
