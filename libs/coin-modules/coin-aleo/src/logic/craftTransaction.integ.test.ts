import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getEnv } from "@ledgerhq/live-env";
import aleoConfig from "../config";
import { testnetViewKey } from "../__tests__/fixtures/api.fixture";
import {
  mockTxIntentFeePrivate,
  mockTxIntentFeePublic,
  mockTxIntentSelfTransferToPrivate,
  mockTxIntentSelfTransferToPublic,
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import { TRANSACTION_TYPE } from "../constants";
import type { FeeConfiguration, PreparedRequestResponse } from "../types";
import { craftTransaction } from "./craftTransaction";
import { fromHex } from "./utils";

describe("craftTransaction", () => {
  const currency = getCryptoCurrencyById("aleo");
  const publicFeeConfiguration: FeeConfiguration = {
    function_name: "fee_public",
    max_base_fee: "34060",
    max_priority_fee: "0",
  };
  const privateFeeConfiguration: FeeConfiguration = {
    function_name: "fee_private",
    max_base_fee: "2308",
    max_priority_fee: "0",
  };

  beforeAll(() => {
    aleoConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      apiUrls: {
        node: getEnv("ALEO_TESTNET_NODE_ENDPOINT"),
        sdk: getEnv("ALEO_TESTNET_SDK_ENDPOINT"),
      },
      feeByTransactionType: {
        [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
        [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
        [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
        [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
      },
      feeSafetyMultiplier: 1,
      isFeeSponsored: true,
      enableTokens: false,
      useEncryptedProve: false,
      recordPickingStrategy: "manual",
    }));
  });

  it.each([
    {
      name: "transfer_public",
      expectedFunctionName: "transfer_public",
      feeConfiguration: publicFeeConfiguration,
      txIntent: mockTxIntentTransferPublic,
    },
    {
      name: "transfer_private",
      expectedFunctionName: "transfer_private",
      feeConfiguration: privateFeeConfiguration,
      txIntent: mockTxIntentTransferPrivate,
      viewKey: testnetViewKey,
    },
    {
      name: "transfer_public_to_private",
      expectedFunctionName: "transfer_public_to_private",
      feeConfiguration: publicFeeConfiguration,
      txIntent: mockTxIntentSelfTransferToPrivate,
    },
    {
      name: "transfer_private_to_public",
      expectedFunctionName: "transfer_private_to_public",
      feeConfiguration: privateFeeConfiguration,
      txIntent: mockTxIntentSelfTransferToPublic,
      viewKey: testnetViewKey,
    },
    {
      name: "fee_public",
      expectedFunctionName: "fee_public",
      feeConfiguration: null,
      txIntent: mockTxIntentFeePublic,
    },
    {
      name: "fee_private",
      expectedFunctionName: "fee_private",
      feeConfiguration: null,
      txIntent: mockTxIntentFeePrivate,
      viewKey: testnetViewKey,
    },
  ])(
    "should craft a prepared request for $name",
    async ({ txIntent, expectedFunctionName, feeConfiguration, viewKey }) => {
      const result = await craftTransaction({
        currency,
        txIntent,
        feeConfiguration,
        ...(typeof viewKey === "string" && { viewKey }),
      });

      expect(typeof result.transaction).toBe("string");
      expect(result.transaction.length).toBeGreaterThan(0);

      const preparedRequest = fromHex<PreparedRequestResponse>(result.transaction);

      expect(preparedRequest.function_name.toLowerCase()).toContain(
        Buffer.from(expectedFunctionName).toString("hex"),
      );
    },
  );
});
