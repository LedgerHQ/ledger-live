import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  TonAccountInfo,
  TonResponseEstimateFee,
  TonResponseWalletInfo,
  TonTransactionsList,
} from "../../bridge/bridgeHelpers/api.types";
import type { Transaction } from "../../types";

export const mockAddress = "UQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbMol";
export const mockAccountId =
  "js:2:ton:b19891a06654f21c64147550b3321bef63acd25b5dd61b688b022c42fac4831d:ton";

export const account = {
  id: mockAccountId,
  freshAddress: mockAddress,
  freshAddressPath: "44'/607'/0'/0'/0'/0'",
  xpub: "",
  type: "Account",
  currency: getCryptoCurrencyById("ton"),
  spendableBalance: new BigNumber("1000000000"),
  balance: new BigNumber("1000000000"),
  seedIdentifier: "seedIdentifier",
} as Account;

export const transaction = {
  mode: "send",
  recipient: "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4",
  amount: new BigNumber("1000000"),
  useAllAmount: false,
  comment: { isEncrypted: false, text: "" },
  payload: "",
  family: "ton",
} as unknown as Transaction;

export const fees = {
  in_fwd_fee: 10000,
  storage_fee: 10000,
  gas_fee: 10000,
  fwd_fee: 10000,
};

export const totalFees = BigNumber(
  fees.fwd_fee + fees.gas_fee + fees.in_fwd_fee + fees.storage_fee,
);

export const lastBlockNumber = {
  last: {
    seqno: 38574413,
  },
  first: {
    seqno: 3,
  },
};

export const tonAccount: TonAccountInfo = {
  balance: "1000000000",
  last_transaction_lt: "47055058000008",
  last_transaction_hash: "psVQqt6rf/Lo6xyLzxx0to0jUIx8I2/4znOVf2KhAI0=",
  status: "active",
  seqno: 3,
};

export const tonWallet: TonResponseWalletInfo = {
  balance: "7726736262",
  wallet_type: "wallet v4 r2",
  seqno: 22,
  wallet_id: 698983191,
  last_transaction_lt: "47055058000008",
  last_transaction_hash: "psVQqt6rf/Lo6xyLzxx0to0jUIx8I2/4znOVf2KhAI0=",
  status: "active",
};

export const tonEstimateFee: TonResponseEstimateFee = {
  source_fees: fees,
  destination_fees: [],
};

export const tonTransactionResponse: TonTransactionsList = {
  transactions: [
    {
      account: mockAddress,
      hash: "hash",
      lt: "lt",
      now: 1718241443,
      orig_status: "active",
      end_status: "active",
      total_fees: "0",
      prev_trans_hash: "",
      prev_trans_lt: "",
      description: "",
      block_ref: null,
      in_msg: {
        source: "0:959EAA8BD0E3A2662D814278D51A6F997946207D48478008BEBE7F45F3EF781F",
        destination: mockAddress,
        value: "13509565",
        hash: "inMsgHash",
        fwd_fee: "266669",
        ihr_fee: "0",
        created_lt: "47055058000007",
        created_at: "1718241443",
        opcode: "0xd53276db",
        ihr_disabled: true,
        bounce: false,
        bounced: false,
        import_fee: null,
        message_content: {
          hash: "Qa0w2xg42wA9taurO/aCVOqGTzjOeP3EpzD2Sl7tTss=",
          body: "te6cckEBAQEADgAAGNUydtsAAAAAAAAAAfRC8y4=",
          decoded: null,
        },
        init_state: null,
      },
      out_msgs: [],
      account_state_before: null,
      account_state_after: null,
      mc_block_seqno: 3,
    },
  ],
  address_book: {},
};

export const accountInfo: TonAccountInfo = {
  balance: "7726736262",
  last_transaction_lt: "47055058000008",
  last_transaction_hash: "lastTransactionHash",
  status: "active",
  seqno: 22,
};
