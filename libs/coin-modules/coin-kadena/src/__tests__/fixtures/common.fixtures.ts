import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Block, ChainAccount, Transfer } from "../../api/types";
import { Transaction } from "../../types";

// Define the mock base URL for the Kadena API
export const API_KADENA_ENDPOINT = "https://api.mainnet.kadindexer.io/v0";
export const API_KADENA_PACT_ENDPOINT = "https://api.chainweb.com";

export const ADDRESS_1 = "k:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375";
export const ADDRESS_2 = "k:8ae62e33629660c10e3faf0fe83b675ff5186116bd29a29fe71179480bf4ae76";
export const ACCOUNT_ID_1 =
  "js:2:kadena:77b021744ab3c003e8e4d0f38a598f0e39fe9a7fe61360754dc7321b112ab375:";
const HASH = "KO2yCnx3VuKWHqvRRsa8TumzjTjsE57ENV8bOFxMLRE";

export const operation: Operation = {
  accountId: ACCOUNT_ID_1,
  blockHash: null,
  blockHeight: null,
  date: new Date(),
  extra: { receiverChainId: 0, senderChainId: 0 },
  fee: BigNumber(0),
  hash: HASH,
  id: `${ACCOUNT_ID_1}-${HASH}-OUT`,
  recipients: [ADDRESS_2],
  senders: [ADDRESS_1],
  type: "OUT",
  value: BigNumber(0),
};

export const rawData = {
  pact_command: {
    cmd: "pactCommand",
    hash: "hash",
    sigs: [
      {
        sig: "sig",
      },
    ],
  },
};

export const account = {
  balance: BigNumber(0),
  blockHeight: 4575073,
  creationDate: new Date(),
  currency: getCryptoCurrencyById("kadena"),
  derivationMode: "",
  feesCurrency: undefined,
  freshAddress: ADDRESS_1,
  freshAddressPath: "44'/626'/1'/0/0",
  id: ACCOUNT_ID_1,
  index: 1,
  type: "Account",
} as Account;

export const transaction = {
  amount: BigNumber(50),
  family: "kadena",
  gasLimit: BigNumber(10),
  gasPrice: BigNumber(1000),
  receiverChainId: 0,
  recipient: ADDRESS_2,
  senderChainId: 0,
  useAllAmount: false,
} as Transaction;

export const coinDetailsForAccount: ChainAccount[] = [{ chainId: "0", balance: 45.759916781498 }];

export const mockTransfer = {
  moduleName: "coin",
  requestKey: "req1",
  block: {
    creationTime: new Date().toISOString(),
    height: 1,
    hash: "blockhash",
    chainId: 0,
  },
  amount: 10,
  senderAccount: "senderAccount",
  receiverAccount: "receiverAccount",
  crossChainTransfer: null,
  transaction: {
    result: { badResult: null, goodResult: "ok", gas: 1 },
    cmd: {
      signers: [
        {
          clist: [
            {
              name: "coin.TRANSFER",
              args: JSON.stringify(["senderAccount", "receiverAccount", { decimal: "10" }, "0"]),
            },
          ],
        },
      ],
    },
  },
} as Transfer;

export const crossChainTransferIn = {
  ...mockTransfer,
  senderAccount: "",
  crossChainTransfer: {
    amount: 10,
    senderAccount: "senderAccount",
    receiverAccount: "",
    receiverChainId: 0,
    block: {
      chainId: 1,
    } as unknown as Block,
  } as unknown as Transfer,
  requestKey: "req2",
} as Transfer;

export const finishedCrossChainTransferOut = {
  ...mockTransfer,
  receiverAccount: "",
  crossChainTransfer: {
    amount: 10,
    senderAccount: "",
    receiverAccount: "receiverAccount",
    block: {
      chainId: 1,
    } as unknown as Block,
  } as unknown as Transfer,
  requestKey: "req3",
} as Transfer;

export const unFinishedCrossChainTransferOut = {
  ...mockTransfer,
  receiverAccount: "",
  crossChainTransfer: null,
  requestKey: "req4",
} as Transfer;
