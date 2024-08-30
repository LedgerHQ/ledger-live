import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  TonAccountInfo,
  TonResponseEstimateFee,
  TonResponseJettonTransfer,
  TonResponseJettonWallets,
  TonResponseWalletInfo,
  TonTransactionsList,
} from "../../bridge/bridgeHelpers/api.types";
import type { Transaction } from "../../types";

export const mockAddress = "UQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbMol";
export const mockAccountId =
  "js:2:ton:b19891a06654f21c64147550b3321bef63acd25b5dd61b688b022c42fac4831d:ton";

export const tokenAccount = {
  id: "subAccountId",
  type: "TokenAccount",
  spendableBalance: new BigNumber("5000000"),
  token: {
    contractAddress: "0:A2CC9B938389950125001F6B8AF280CACA23BE045714AD69387DD546588D667E",
  },
} as TokenAccount;

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
  subAccounts: [tokenAccount],
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

export const jettonTransaction = {
  ...transaction,
  subAccountId: "subAccountId",
} as Transaction;

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

export const jettonWallets: TonResponseJettonWallets = {
  jetton_wallets: [
    {
      address: "0:495AB6C978E3C0AE7FCF863A2D4504E37CE8D2D04A5E59048301BA29EC372F79",
      balance: "1200000000000",
      owner: "0:D02D314791CB10EF3F964CC7421E4F46348C262444946F7A64C2374700E3ED19",
      jetton: "0:3C52A0A732A83F022E517E5C2715E0EE458A4B9772580E903FF491526C3E9137",
      last_transaction_lt: "30345242000008",
      code_hash: "3axDia4eCUnTVixqU0/BUA4i8id5BtVw1pt/yayZd6k=",
      data_hash: "P8j0kENM5s4zE2w5IpD8NrrSneGQ7d0mzs5yTBNPlqo=",
    },
  ],
};

export const tonEstimateFee: TonResponseEstimateFee = {
  source_fees: fees,
  destination_fees: [],
};

export const jettonTransferResponse: TonResponseJettonTransfer = {
  jetton_transfers: [
    {
      query_id: "1",
      source: "UQDnqcVSV4S9m2Y9gLAQrDerQktKSx2I1uhs6r5o_H8VT4x7",
      destination: mockAddress,
      amount: "",
      source_wallet: "",
      jetton_master: "0:729C13B6DF2C07CBF0A06AB63D34AF454F3D320EC1BCD8FB5C6D24D0806A17C2",
      transaction_hash: "",
      transaction_lt: "",
      transaction_now: 0,
      response_destination: "",
      custom_payload: null,
      forward_ton_amount: "",
      forward_payload: null,
    },
  ],
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
      description: {
        aborted: true,
        destroyed: false,
        compute_ph: {
          success: false,
          exit_code: -14,
        },
        credit_first: true,
      },
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
