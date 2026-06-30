import { createActor } from "xstate";
import type { Account, EIP712Message } from "@ledgerhq/types-live";
import { createSwapFlowMachine } from "./machine";
import type {
  SwapFlowPlan,
  SwapFlowPorts,
  SwapFlowResolvers,
} from "./types";

type TestIntent = { kind: string };
type TestInitInput = { appName: string };

const ETHEREUM_INIT: TestInitInput = { appName: "Ethereum" };

const FAKE_ACCOUNT = {
  freshAddress: "0xfrom",
  freshAddressPath: "44'/60'/0'/0/0",
  currency: { id: "ethereum", family: "evm" },
} as unknown as Account;

const RFQ_TYPED_DATA: EIP712Message = {
  domain: { name: "Permit2", chainId: 1, verifyingContract: "0xv" },
  primaryType: "PermitWitnessTransferFrom",
  message: {},
  types: {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
    PermitWitnessTransferFrom: [],
  },
};

const APPROVAL_TX = {
  calldata: "0xabc",
  from: "0xfrom",
  gasLimit: 100_000,
  gasPrice: 1_000_000_000,
  to: "0xspender",
  value: "0",
};

const RFQ_PLAN: Extract<SwapFlowPlan, { kind: "rfq-order" }> = {
  kind: "rfq-order",
  rfqProvider: "uniswapx",
  provider: "uniswap",
  orderTypedData: RFQ_TYPED_DATA,
  submitBody: { "@type": "UniswapDutchCustomFields", routing: "DUTCH_V2" },
  network: "ethereum",
};

const APPROVAL_THEN_RFQ_PLAN: Extract<
  SwapFlowPlan,
  { kind: "approval-then-rfq-order" }
> = {
  kind: "approval-then-rfq-order",
  approvalTransaction: APPROVAL_TX,
  rfqProvider: "uniswapx",
  provider: "uniswap",
  orderTypedData: RFQ_TYPED_DATA,
  submitBody: { "@type": "UniswapDutchCustomFields", routing: "DUTCH_V2" },
  network: "ethereum",
};

function makePorts(): SwapFlowPorts<TestIntent, TestInitInput> {
  return {
    createSignApprovalIntent: () => ({
      intent: { kind: "sign-approval" },
      initInput: ETHEREUM_INIT,
    }),
    createSignSwapIntent: () => ({
      intent: { kind: "sign-swap" },
      initInput: ETHEREUM_INIT,
    }),
    createSignPermit2Intent: () => ({
      intent: { kind: "sign-permit2" },
      initInput: ETHEREUM_INIT,
    }),
    createSignRfqOrderIntent: () => ({
      intent: { kind: "sign-rfq" },
      initInput: ETHEREUM_INIT,
    }),
    createSubmitRfqOrderIntent: ({ initInput }) => ({
      intent: { kind: "submit-rfq" },
      initInput,
    }),
    createBroadcastIntent: ({ initInput }) => ({
      intent: { kind: "broadcast" },
      initInput,
    }),
    buildSwapTransactionData: () => {
      throw new Error("buildSwapTransactionData should not be called in RFQ flows");
    },
  };
}

function startActor(plan: SwapFlowPlan) {
  const actor = createActor(createSwapFlowMachine(makePorts()));
  actor.start();
  const resolved: unknown[] = [];
  const rejected: unknown[] = [];
  const resolvers: SwapFlowResolvers = {
    resolve: r => resolved.push(r),
    reject: r => rejected.push(r),
  };
  actor.send({
    type: "START",
    input: {
      plan,
      mainAccount: FAKE_ACCOUNT,
      currencyId: "ethereum",
      derivationPath: "44'/60'/0'/0/0",
      initInput: ETHEREUM_INIT,
      resolvers,
    },
  });
  return { actor, resolved, rejected };
}

describe("createSwapFlowMachine — RFQ paths", () => {
  it("runs the direct rfq-order plan: signRfqOrder -> submitRfqOrder -> rfqSuccess -> resolve", () => {
    const { actor, resolved } = startActor(RFQ_PLAN);
    expect(actor.getSnapshot().value).toBe("signRfqOrder");
    expect(actor.getSnapshot().context.currentIntent).toEqual({
      kind: "sign-rfq",
    });

    actor.send({ type: "JOB_RFQ_SIGNED", signatureHex: "0xsig" });
    expect(actor.getSnapshot().value).toBe("submitRfqOrder");
    expect(actor.getSnapshot().context.rfqOrderSignature).toBe("0xsig");
    expect(actor.getSnapshot().context.currentIntent).toEqual({
      kind: "submit-rfq",
    });

    actor.send({
      type: "JOB_RFQ_SUBMITTED",
      outcome: {
        status: "finished",
        txHash: "0xfilled",
        swapId: "swap-1",
        finalAmount: "100",
      },
    });
    expect(actor.getSnapshot().value).toBe("rfqSuccess");

    actor.send({ type: "SWAP_DISMISSED" });
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toEqual({
      rfqStatus: "finished",
      swapTxHash: "0xfilled",
      swapId: "swap-1",
      finalAmount: "100",
    });
  });

  it("runs approval-then-rfq-order: approval -> approvalSuccess -> signRfqOrder -> submitRfqOrder", () => {
    const { actor, resolved } = startActor(APPROVAL_THEN_RFQ_PLAN);
    expect(actor.getSnapshot().value).toBe("signApproval");

    actor.send({ type: "JOB_SIGNED", signedTxHex: "0xtxhex" });
    expect(actor.getSnapshot().value).toBe("broadcastApproval");

    actor.send({ type: "JOB_CONFIRMED", hash: "0xapprovaltx" });
    expect(actor.getSnapshot().value).toBe("approvalSuccess");
    expect(actor.getSnapshot().context.approvalTxHash).toBe("0xapprovaltx");

    actor.send({ type: "SWAP_PRESSED" });
    expect(actor.getSnapshot().value).toBe("signRfqOrder");

    actor.send({ type: "JOB_RFQ_SIGNED", signatureHex: "0xrfqsig" });
    expect(actor.getSnapshot().value).toBe("submitRfqOrder");

    actor.send({
      type: "JOB_RFQ_SUBMITTED",
      outcome: { status: "refunded" },
    });
    expect(actor.getSnapshot().value).toBe("rfqSuccess");

    actor.send({ type: "SWAP_DISMISSED" });
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toEqual({
      approvalTxHash: "0xapprovaltx",
      rfqStatus: "refunded",
    });
  });

  it("rejects when the sign-rfq job fails", () => {
    const { actor, rejected } = startActor(RFQ_PLAN);
    actor.send({ type: "JOB_FAILED", error: new Error("user rejected") });
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as Error).message).toBe("user rejected");
  });

  it("rejects when the submit-rfq job fails after signing", () => {
    const { actor, rejected } = startActor(RFQ_PLAN);
    actor.send({ type: "JOB_RFQ_SIGNED", signatureHex: "0xsig" });
    actor.send({
      type: "JOB_FAILED",
      error: new Error("partner submit timeout"),
    });
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as Error).message).toBe("partner submit timeout");
  });

  it("forwards the precomputed order id and signature into the submit intent input", () => {
    let captured: { submitBody: unknown; precomputedOrderId?: string } | null = null;
    const ports: SwapFlowPorts<TestIntent, TestInitInput> = {
      ...makePorts(),
      createSubmitRfqOrderIntent: input => {
        captured = {
          submitBody: input.submitBody,
          precomputedOrderId: input.precomputedOrderId,
        };
        return { intent: { kind: "submit-rfq" }, initInput: input.initInput };
      },
    };
    const actor = createActor(createSwapFlowMachine(ports));
    actor.start();
    actor.send({
      type: "START",
      input: {
        plan: {
          kind: "rfq-order",
          rfqProvider: "oneinchfusion",
          provider: "oneinchfusion",
          orderTypedData: RFQ_TYPED_DATA,
          submitBody: { foo: "bar" },
          precomputedOrderId: "0xdead",
          network: "ethereum",
        },
        mainAccount: FAKE_ACCOUNT,
        currencyId: "ethereum",
        derivationPath: "44'/60'/0'/0/0",
        initInput: ETHEREUM_INIT,
        resolvers: { resolve: () => {}, reject: () => {} },
      },
    });
    actor.send({ type: "JOB_RFQ_SIGNED", signatureHex: "0xsig" });
    expect(captured).toEqual({
      submitBody: { foo: "bar", signature: "0xsig" },
      precomputedOrderId: "0xdead",
    });
  });
});
