import { buildSignOperation } from "./signOperation";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { MultiversXAccount, Transaction } from "./types";

jest.mock("./buildOptimisticOperation", () => ({
  buildOptimisticOperation: jest.fn(() => ({
    id: "op1",
    hash: "",
    type: "OUT",
    value: BigInt(1000),
    fee: BigInt(50),
    senders: ["sender"],
    recipients: ["recipient"],
    blockHeight: null,
    blockHash: null,
    accountId: "account1",
    date: new Date(),
    extra: {},
  })),
}));

jest.mock("./buildTransaction", () => ({
  buildTransactionToSign: jest.fn(() => Promise.resolve('{"nonce":1,"value":"1000"}')),
}));

jest.mock("@ledgerhq/coin-framework/account", () => ({
  decodeTokenAccountId: jest.fn(() => Promise.resolve({ token: null })),
}));

jest.mock("./logic", () => ({
  extractTokenId: jest.fn(() => "token_hex_id"),
}));

describe("signOperation", () => {
  const createMockSigner = () => ({
    setAddress: jest.fn(() => Promise.resolve()),
    provideESDTInfo: jest.fn(() => Promise.resolve()),
    sign: jest.fn(() => Promise.resolve({ signature: Buffer.from("signature123") })),
  });

  const createMockSignerContext = (mockSigner: ReturnType<typeof createMockSigner>) => {
    return jest.fn((deviceId: string, fn: (signer: any) => Promise<any>) => fn(mockSigner));
  };

  const createAccount = (overrides = {}): MultiversXAccount =>
    ({
      id: "account1",
      freshAddress: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
      freshAddressPath: "44'/508'/0'/0'/0'",
      spendableBalance: new BigNumber("10000000000000000000"),
      currency: {
        name: "MultiversX",
        units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
      },
      multiversxResources: {
        nonce: 1,
        delegations: [],
        isGuarded: false,
      },
      subAccounts: [],
      ...overrides,
    }) as unknown as MultiversXAccount;

  const createTransaction = (overrides = {}): Transaction => ({
    family: "multiversx",
    mode: "send",
    amount: new BigNumber("1000000000000000000"),
    recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    useAllAmount: false,
    fees: new BigNumber("50000000000000"),
    gasLimit: 50000,
    ...overrides,
  });

  describe("buildSignOperation", () => {
    it("returns a function that creates an Observable", () => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      const result = signOperation({ account, transaction, deviceId: "device1" });

      expect(result).toBeInstanceOf(Observable);
    });

    it("throws FeeNotLoaded when fees are null", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction({ fees: null });

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        error: err => {
          expect(err).toBeInstanceOf(FeeNotLoaded);
          done();
        },
      });
    });

    it("emits device-signature-requested event", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      const events: any[] = [];
      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        next: event => {
          events.push(event);
        },
        complete: () => {
          expect(events.some(e => e.type === "device-signature-requested")).toBe(true);
          done();
        },
      });
    });

    it("emits device-signature-granted event", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      const events: any[] = [];
      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        next: event => {
          events.push(event);
        },
        complete: () => {
          expect(events.some(e => e.type === "device-signature-granted")).toBe(true);
          done();
        },
      });
    });

    it("emits signed event with signedOperation", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      const events: any[] = [];
      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        next: event => {
          events.push(event);
        },
        complete: () => {
          const signedEvent = events.find(e => e.type === "signed");
          expect(signedEvent).toBeDefined();
          expect(signedEvent.signedOperation).toBeDefined();
          expect(signedEvent.signedOperation.signature).toBeDefined();
          done();
        },
      });
    });

    it("calls setAddress on signer", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        complete: () => {
          expect(mockSigner.setAddress).toHaveBeenCalledWith(account.freshAddressPath);
          done();
        },
      });
    });

    it("calls sign on signer with transaction", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        complete: () => {
          expect(mockSigner.sign).toHaveBeenCalled();
          done();
        },
      });
    });

    it("throws error when signature is null", done => {
      const mockSigner = createMockSigner();
      mockSigner.sign.mockResolvedValue({ signature: null });
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        error: err => {
          expect(err.message).toBe("No signature");
          done();
        },
      });
    });

    it("handles token transfer with provideESDTInfo", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const { decodeTokenAccountId } = jest.requireMock("@ledgerhq/coin-framework/account");
      decodeTokenAccountId.mockResolvedValue({
        token: {
          id: "multiversx/esdt/token1",
          ticker: "USDC",
          units: [{ magnitude: 6 }],
          ledgerSignature: "signature",
        },
      });

      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("5000000000"),
        token: {
          id: "multiversx/esdt/token1",
          ticker: "USDC",
        },
      };

      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const transaction = createTransaction({ subAccountId: "token1" });

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        complete: () => {
          expect(mockSigner.provideESDTInfo).toHaveBeenCalled();
          done();
        },
      });
    });

    it("throws error for invalid token in token transfer", done => {
      const mockSigner = createMockSigner();
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const { decodeTokenAccountId } = jest.requireMock("@ledgerhq/coin-framework/account");
      decodeTokenAccountId.mockResolvedValue({ token: null });

      const tokenAccount = {
        id: "token1",
        type: "TokenAccount",
        balance: new BigNumber("5000000000"),
      };

      const account = createAccount({
        subAccounts: [tokenAccount],
      });
      const transaction = createTransaction({ subAccountId: "token1" });

      signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        error: err => {
          expect(err.message).toBe("Invalid token");
          done();
        },
      });
    });

    it("can be cancelled", done => {
      const mockSigner = createMockSigner();
      // Make sign take some time
      mockSigner.sign.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ signature: Buffer.from("sig") }), 100)),
      );
      const signerContext = createMockSignerContext(mockSigner);
      const signOperation = buildSignOperation(signerContext);

      const account = createAccount();
      const transaction = createTransaction();

      const subscription = signOperation({ account, transaction, deviceId: "device1" }).subscribe({
        next: () => {},
      });

      // Cancel immediately
      subscription.unsubscribe();

      // Give some time for async operations
      setTimeout(() => {
        done();
      }, 200);
    });
  });
});
