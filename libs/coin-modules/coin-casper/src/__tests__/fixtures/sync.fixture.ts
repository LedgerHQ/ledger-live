import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { DerivationMode } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ITxnHistoryData } from "../../types/network";
import { TEST_ADDRESSES } from "./addresses.fixture";

export const createMockAccountShapeData = () => {
  const mockAddress = TEST_ADDRESSES.SECP256K1;
  const mockCurrency = getCryptoCurrencyById("casper");
  const mockDerivationMode: DerivationMode = "casper_wallet";
  const mockAccountInfo = {
    address: mockAddress,
    currency: mockCurrency,
    derivationMode: mockDerivationMode,
    index: 0,
    derivationPath: "44'/506'/0'/0/0",
  };

  const mockAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: mockCurrency.id,
    xpubOrAddress: mockAddress,
    derivationMode: mockDerivationMode,
  });

  const mockBlockHeight = 12345;
  const mockPurseUref = "uref-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef-007";
  const mockAccountHash =
    "account-hash-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const mockBalance = new BigNumber("1000000000");

  const mockTxs: ITxnHistoryData[] = [
    {
      deploy_hash: "deploy-hash-1",
      block_hash: "block-hash-1",
      caller_public_key: mockAddress,
      execution_type_id: 1,
      cost: "10000",
      payment_amount: "100000000",
      timestamp: "2023-01-01T12:00:00Z",
      status: "success",
      args: {
        id: {
          parsed: 12345,
          cl_type: { Option: "U64" },
        },
        amount: {
          parsed: "500000000",
          cl_type: "U512",
        },
        target: {
          parsed: TEST_ADDRESSES.RECIPIENT_SECP256K1,
          cl_type: "PublicKey",
        },
      },
      amount: "500000000",
    },
  ];

  const mockOperations = [
    {
      id: "mock-operation-id",
      hash: "deploy-hash-1",
      type: "OUT",
      value: new BigNumber("550000000"),
      fee: new BigNumber("50000000"),
      blockHeight: 12345,
      blockHash: null,
      hasFailed: false,
      accountId: mockAccountId,
      senders: [mockAccountHash],
      recipients: ["recipient-account-hash"],
      date: new Date("2023-01-01T12:00:00Z"),
      extra: { transferId: "12345" },
    },
  ];

  return {
    mockAddress,
    mockCurrency,
    mockDerivationMode,
    mockAccountInfo,
    mockAccountId,
    mockBlockHeight,
    mockPurseUref,
    mockAccountHash,
    mockBalance,
    mockTxs,
    mockOperations,
  };
};
