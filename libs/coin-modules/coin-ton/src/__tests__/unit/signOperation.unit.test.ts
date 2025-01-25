import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Address, Cell, beginCell, storeMessage } from "@ton/core";
import BigNumber from "bignumber.js";
import { fetchAccountInfo } from "../../bridge/bridgeHelpers/api";
import { buildSignOperation } from "../../signOperation";
import { TonSigner } from "../../signer";
import { account, accountInfo, totalFees, transaction } from "../fixtures/common.fixtures";

jest.mock("../../bridge/bridgeHelpers/api");

const spySignTransaction = jest.fn().mockImplementation(async () =>
  Promise.resolve(
    beginCell()
      .store(
        storeMessage({
          info: {
            type: "external-in",
            dest: Address.parse("EQDzd8aeBOU-jqYw_ZSuZjceI5p-F4b7HMprAsUJAtRPbJfg"),
            importFee: BigInt(0),
          },
          body: new Cell(),
        }),
      )
      .endCell(),
  ),
);

const mockSignerContext: SignerContext<TonSigner> = <T>(
  _: string,
  fn: (signer: TonSigner) => Promise<T>,
) => {
  return fn({
    signTransaction: spySignTransaction,
    getAddress: jest.fn(),
    validateAddress: jest.fn(),
  });
};

describe("signOperation", () => {
  beforeAll(() => {
    const fetchAccountInfoMock = jest.mocked(fetchAccountInfo);
    fetchAccountInfoMock.mockReturnValue(Promise.resolve(accountInfo));
  });

  it("should return an optimistic operation and a signed hash returned by the app bindings", done => {
    const signOperation = buildSignOperation(mockSignerContext);

    const signOpObservable = signOperation({
      account,
      transaction: { ...transaction, fees: totalFees },
      deviceId: "",
    });

    signOpObservable.subscribe(obs => {
      if (obs.type === "signed") {
        const {
          signedOperation: { signature, operation },
        } = obs;

        const { amount } = transaction;

        expect(operation).toEqual({
          id: "",
          hash: "",
          type: "OUT",
          value: new BigNumber(amount).plus(totalFees),
          fee: totalFees,
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          accountId: account.id,
          date: expect.any(Date),
          extra: {
            comment: {
              isEncrypted: false,
              text: "",
            },
            explorerHash: "",
            lt: "",
          },
        });
        expect(signature).toBe(
          "te6cckEBAQEASAAAi4gB5u+NPAnKfR1MYfspXMxuPEc0/C8N9jmU1gWKEgWontgEQA83fGngTlPo6mMP2UrmY3HiOafheG+xzKawLFCQLUT2wCDSMh+F",
        );
        done();
      }
    });
  });
});
