import { broadcast } from "./broadcast";
import coinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "mainnet",
      apiUrls: {
        node: "https://aleo.coin.ledger.com",
        sdk: "https://aleo-backend.api.live.ledger.com/network/mainnet",
      },
      feeByTransactionType: {
        [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 34060,
        [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2308,
        [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 17972,
        [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 18494,
      },
      feeSafetyMultiplier: 1.0,
      isFeeSponsored: false,
      enableTokens: false,
      useEncryptedProve: true,
      recordPickingStrategy: "manual",
    }));
  });

  it("creates an offline transfer_public signature and fails to broadcast with zero balance", async () => {
    const { Account, ProgramManager } = await import("@provablehq/sdk/mainnet.js");
    const sender = new Account();
    const receiver = new Account();
    try {
      const programManager = new ProgramManager();

      // Build the transfer_public authorization fully offline — no network needed
      const authorization = await programManager.buildAuthorizationUnchecked({
        programName: "credits.aleo",
        functionName: "transfer_public",
        privateKey: sender.privateKey(),
        inputs: [receiver.address().toString(), "10u64"],
      });

      const executionId = authorization.toExecutionId().toString();

      // Build the fee_public authorization offline using the execution id
      const feeAuthorization = await programManager.buildFeeAuthorization({
        deploymentOrExecutionId: executionId,
        baseFeeCredits: 0.03406,
        privateKey: sender.privateKey(),
      });

      const signedTx = Buffer.from(
        JSON.stringify({
          authorization: JSON.parse(authorization.toString()),
          feeAuthorization: JSON.parse(feeAuthorization.toString()),
        }),
      ).toString("hex");

      const account = getMockedAccount();
      const operation = getMockedOperation({ accountId: account.id, hash: "" });

      // Broadcasting should fail — the random sender account has no on-chain balance
      await expect(
        broadcast({
          account,
          signedOperation: {
            signature: signedTx,
            operation,
          },
        }),
      ).rejects.toThrow(/the payer account balance is missing/);
    } finally {
      sender.destroy();
      receiver.destroy();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
