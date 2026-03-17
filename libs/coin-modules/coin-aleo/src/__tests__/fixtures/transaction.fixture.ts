import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../../constants";
import type { AleoDecryptedRecordResponse, Transaction, TransactionRaw } from "../../types";

const ALEO_RECIPIENT = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

type PublicTransaction = Extract<Transaction, { mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC }>;
type PublicTransactionRaw = Extract<
  TransactionRaw,
  { mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC }
>;

type PublicMode =
  | typeof TRANSACTION_TYPE.TRANSFER_PUBLIC
  | typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
type PrivateMode =
  | typeof TRANSACTION_TYPE.TRANSFER_PRIVATE
  | typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;

type SharedOverrides = Omit<Partial<PublicTransaction>, "mode" | "properties">;
type GetMockedTransactionOverrides =
  | (SharedOverrides & { mode?: PublicMode })
  | (SharedOverrides & { mode: PrivateMode });

const isPrivateMode = (mode: PublicMode | PrivateMode): mode is PrivateMode =>
  mode === TRANSACTION_TYPE.TRANSFER_PRIVATE || mode === TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;

export const getMockedTransaction = (overrides?: GetMockedTransactionOverrides): Transaction => {
  const mode = overrides?.mode ?? TRANSACTION_TYPE.TRANSFER_PUBLIC;
  const base = {
    family: "aleo" as const,
    amount: new BigNumber(0),
    recipient: ALEO_RECIPIENT,
    fees: new BigNumber(0),
    useAllAmount: false,
  };

  if (isPrivateMode(mode)) {
    return {
      ...base,
      ...overrides,
      mode,
      properties: { amountRecord: null, feeRecord: null },
    };
  }

  return { ...base, ...overrides, mode };
};

export const getMockedTransactionRaw = (
  overrides?: Partial<PublicTransactionRaw>,
): PublicTransactionRaw => {
  return {
    family: "aleo",
    amount: "0",
    recipient: ALEO_RECIPIENT,
    fees: "0",
    useAllAmount: false,
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...overrides,
  };
};

export const mockedDecryptedRecord: AleoDecryptedRecordResponse = {
  owner: "aleo1abc123",
  data: { microcredits: "1000000u64.private" },
  nonce: "0group",
  version: 1,
};

export const mockedTransferPrivateTransactionRaw: TransactionRaw = {
  family: "aleo",
  amount: "0",
  recipient: ALEO_RECIPIENT,
  fees: "0",
  useAllAmount: false,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: {
    amountRecord: JSON.stringify(mockedDecryptedRecord),
    feeRecord: JSON.stringify(mockedDecryptedRecord),
  },
};

export const mockedTransferPrivateTransaction: Transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: ALEO_RECIPIENT,
  fees: new BigNumber(0),
  useAllAmount: false,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: {
    amountRecord: mockedDecryptedRecord,
    feeRecord: mockedDecryptedRecord,
  },
};

export const mockedTransferPrivateNullRecordsTransactionRaw: TransactionRaw = {
  family: "aleo",
  amount: "0",
  recipient: ALEO_RECIPIENT,
  fees: "0",
  useAllAmount: false,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: {
    amountRecord: null,
    feeRecord: null,
  },
};

export const mockedTransferPrivateNullRecordsTransaction: Transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: ALEO_RECIPIENT,
  fees: new BigNumber(0),
  useAllAmount: false,
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: {
    amountRecord: null,
    feeRecord: null,
  },
};

export const mockedConvertPrivateToPublicTransactionRaw: TransactionRaw = {
  family: "aleo",
  amount: "0",
  recipient: ALEO_RECIPIENT,
  fees: "0",
  useAllAmount: false,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  properties: {
    amountRecord: JSON.stringify(mockedDecryptedRecord),
    feeRecord: JSON.stringify(mockedDecryptedRecord),
  },
};

export const mockedConvertPrivateToPublicTransaction: Transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: ALEO_RECIPIENT,
  fees: new BigNumber(0),
  useAllAmount: false,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  properties: {
    amountRecord: mockedDecryptedRecord,
    feeRecord: mockedDecryptedRecord,
  },
};

export const mockedConvertPrivateToPublicNullRecordsTransactionRaw: TransactionRaw = {
  family: "aleo",
  amount: "0",
  recipient: ALEO_RECIPIENT,
  fees: "0",
  useAllAmount: false,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  properties: {
    amountRecord: null,
    feeRecord: null,
  },
};

export const mockedConvertPrivateToPublicNullRecordsTransaction: Transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: ALEO_RECIPIENT,
  fees: new BigNumber(0),
  useAllAmount: false,
  mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  properties: {
    amountRecord: null,
    feeRecord: null,
  },
};
