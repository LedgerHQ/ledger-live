import * as network from "../../api/network";
import { Event, Transfer } from "../../api/types";
import { setCoinConfig } from "../../config";
import {
  getCrossChainTransferStart,
  getSigner,
  matchAmount,
  matchReceiver,
  matchSender,
  parsePactNumber,
  rawTxsToOps,
} from "../../synchronisation";
import {
  API_KADENA_ENDPOINT,
  API_KADENA_PACT_ENDPOINT,
  crossChainTransferIn,
  finishedCrossChainTransferOut,
  mockTransfer,
  unFinishedCrossChainTransferOut,
} from "../fixtures/common.fixtures";

jest.mock("../../api/network");

describe("synchronisation", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_KADENA_ENDPOINT,
        API_KADENA_PACT_ENDPOINT,
        API_KEY_KADENA_ENDPOINT: "",
      },
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("helper functions", () => {
    describe("parsePactNumber", () => {
      it("parses a number", () => {
        expect(parsePactNumber(5)).toBe(5);
      });
      it("parses a decimal object", () => {
        expect(parsePactNumber({ decimal: "1.23" })).toBeCloseTo(1.23);
      });
      it("parses an int object", () => {
        expect(parsePactNumber({ int: "42" })).toBe(42);
      });
      it("throws on invalid object", () => {
        expect(() => parsePactNumber({ foo: "bar" })).toThrow();
      });
      it("throws on string", () => {
        expect(() => parsePactNumber("not a number")).toThrow();
      });
    });

    describe("matchSender", () => {
      it("matches sender correctly", () => {
        expect(
          matchSender({ senderAccount: "senderAccount" } as unknown as Transfer, "senderAccount"),
        ).toBe(true);
        expect(
          matchSender({ senderAccount: "senderAccount" } as unknown as Transfer, "anotherAccount"),
        ).toBe(false);
        expect(matchSender({ senderAccount: "" } as unknown as Transfer, "any")).toBe(true);
      });
    });

    describe("matchReceiver", () => {
      it("matches receiver correctly", () => {
        expect(
          matchReceiver(
            { receiverAccount: "receiverAccount" } as unknown as Transfer,
            "receiverAccount",
          ),
        ).toBe(true);
        expect(
          matchReceiver(
            { receiverAccount: "receiverAccount" } as unknown as Transfer,
            "anotherAccount",
          ),
        ).toBe(false);
        expect(matchReceiver({ receiverAccount: "" } as unknown as Transfer, "any")).toBe(true);
      });
    });

    describe("matchAmount", () => {
      it("matches amount correctly", () => {
        expect(matchAmount({ amount: 5 } as unknown as Transfer, 5)).toBe(true);
        expect(matchAmount({ amount: 4 } as unknown as Transfer, 5)).toBe(true);
        expect(matchAmount({ amount: 6 } as unknown as Transfer, 5)).toBe(false);
        expect(matchAmount({ amount: 5 } as unknown as Transfer, { decimal: "5.0" })).toBe(true);
        expect(matchAmount({ amount: 5 } as unknown as Transfer, { int: "5" })).toBe(true);
      });
    });

    describe("getCrossChainTransferStart", () => {
      const transfer = {
        senderAccount: "senderAccount",
        receiverAccount: "receiverAccount",
        amount: 5,
        crossChainTransfer: null,
      } as unknown as Transfer;
      const events: Event[] = [
        {
          name: "TRANSFER_XCHAIN",
          parameters: JSON.stringify(["senderAccount", "receiverAccount", 5, "1"]),
        },
      ];
      it("extracts cross chain params", () => {
        const result = getCrossChainTransferStart(transfer, events);
        expect(result).toEqual({
          senderAccount: "senderAccount",
          receiverAccount: "receiverAccount",
          receiverChainId: 1,
        });
      });
      it("returns null if no match", () => {
        const noEvents = [{ name: "OTHER_EVENT", parameters: "[]" }];
        expect(getCrossChainTransferStart(transfer, noEvents)).toBeNull();
      });
    });

    describe("getSigner", () => {
      it("extracts signer params", () => {
        const transfer = {
          senderAccount: "senderAccount",
          block: { chainId: 0 },
          transaction: {
            cmd: {
              signers: [
                {
                  clist: [
                    {
                      name: "coin.TRANSFER",
                      args: JSON.stringify([
                        "senderAccount",
                        "receiverAccount",
                        { decimal: "1.5" },
                        "2",
                      ]),
                    },
                  ],
                },
              ],
            },
          },
        } as unknown as Transfer;
        const result = getSigner(transfer);
        expect(result).toEqual({
          receiverAccount: "receiverAccount",
          amount: expect.any(Object),
          receiverChainId: 2,
        });
        expect(result?.amount?.toNumber()).toBeCloseTo(1.5);
      });
      it("returns null if no signer", () => {
        const transfer = {
          block: { chainId: 0 },
          transaction: {
            cmd: {
              signers: [
                {
                  clist: [
                    {
                      name: "coin.GAS",
                      args: JSON.stringify([]),
                    },
                  ],
                },
              ],
            },
          },
        } as unknown as Transfer;
        expect(getSigner(transfer)).toBeNull();
      });
    });

    describe("rawTxsToOps", () => {
      it("converts non cross chain transfers to operations", async () => {
        const accountId = "accid";
        const address = mockTransfer.senderAccount;
        const nonCrossChainTransferOut = {
          ...mockTransfer,
        };
        const nonCrossChainTransferIn = {
          ...mockTransfer,
          requestKey: "req2",
          block: { ...mockTransfer.block, chainId: 0 },
          senderAccount: "otherAccount",
          receiverAccount: address,
        };

        const ops = await rawTxsToOps(
          [nonCrossChainTransferOut, nonCrossChainTransferIn],
          accountId,
          address,
        );
        expect(ops).toHaveLength(2);

        // OUT operation
        expect(ops[0]).toMatchObject({
          accountId,
          hash: "req1",
          type: "OUT",
          senders: ["senderAccount"],
          recipients: ["receiverAccount"],
          hasFailed: false,
          extra: {
            senderChainId: 0,
            receiverChainId: 0,
          },
        });

        // IN operation
        expect(ops[1]).toMatchObject({
          accountId,
          hash: "req2",
          type: "IN",
          senders: ["otherAccount"],
          recipients: [address],
          hasFailed: false,
          extra: {
            senderChainId: 0,
            receiverChainId: 0,
          },
        });
      });

      it("converts OUT finished cross chain transfers to operations", async () => {
        const accountId = "accid";
        const address = finishedCrossChainTransferOut.senderAccount;

        const ops = await rawTxsToOps([finishedCrossChainTransferOut], accountId, address);
        expect(ops).toHaveLength(1);

        // OUT operation
        expect(ops[0]).toMatchObject({
          accountId,
          hash: finishedCrossChainTransferOut.requestKey,
          type: "OUT",
          senders: [finishedCrossChainTransferOut.senderAccount],
          recipients: [finishedCrossChainTransferOut.crossChainTransfer?.receiverAccount],
          hasFailed: false,
          extra: {
            senderChainId: finishedCrossChainTransferOut.block.chainId,
            receiverChainId: finishedCrossChainTransferOut.crossChainTransfer?.block.chainId,
          },
        });
      });

      it("converts IN finished cross chain transfers to operations", async () => {
        const accountId = "accid";
        const address = crossChainTransferIn.receiverAccount;

        const ops = await rawTxsToOps([crossChainTransferIn], accountId, address);
        expect(ops).toHaveLength(1);

        // OUT operation
        expect(ops[0]).toMatchObject({
          accountId,
          hash: crossChainTransferIn.requestKey,
          type: "IN",
          senders: [crossChainTransferIn.crossChainTransfer?.senderAccount],
          recipients: [crossChainTransferIn.receiverAccount],
          hasFailed: false,
          extra: {
            senderChainId: crossChainTransferIn.crossChainTransfer?.block.chainId,
            receiverChainId: crossChainTransferIn.block.chainId,
          },
        });
      });

      it("converts unfinished cross chain transfers to operations", async () => {
        const accountId = "accid";
        const address = unFinishedCrossChainTransferOut.senderAccount;
        const receiverChainId = "2";
        const receiverAccount = "receiverAccount";

        // Mock fetchEvents to return cross chain transfer event
        jest.spyOn(network, "fetchEvents").mockResolvedValue([
          {
            name: "TRANSFER_XCHAIN",
            parameters: JSON.stringify([
              unFinishedCrossChainTransferOut.senderAccount,
              receiverAccount,
              { decimal: unFinishedCrossChainTransferOut.amount.toString() },
              receiverChainId,
            ]),
          },
        ]);

        const ops = await rawTxsToOps([unFinishedCrossChainTransferOut], accountId, address);
        expect(ops).toHaveLength(1);

        // OUT operation
        expect(ops[0]).toMatchObject({
          accountId,
          hash: unFinishedCrossChainTransferOut.requestKey,
          type: "OUT",
          senders: [unFinishedCrossChainTransferOut.senderAccount],
          recipients: [receiverAccount],
          hasFailed: false,
          extra: {
            senderChainId: unFinishedCrossChainTransferOut.block.chainId,
            receiverChainId: Number(receiverChainId),
          },
        });
      });
    });
  });
});
