import BigNumber from "bignumber.js";
import { derivePrincipalFromPubkey } from "../logic/crypto";
import { getNeuronStakeSubAccountIdentifier } from "../logic/buildNeuronTransaction";
import { ICPNeuron, NeuronsData, Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

// Valid raw secp256k1 public key (from crypto.test.ts).
const XPUB =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";

const account = {
  xpub: XPUB,
  freshAddress: "bc48adb687ce410003215edd17d4c6a576d4fe6b64e242bac382aa88ccf15417",
  freshAddressPath: "44'/223'/0'/0/0",
  spendableBalance: new BigNumber(1_000_000_000),
} as any;

const tx = (over: Partial<Transaction>): Transaction =>
  ({
    amount: new BigNumber(0),
    fees: new BigNumber(10000),
    recipient: "",
    useAllAmount: false,
    ...over,
  }) as Transaction;

describe("prepareTransaction", () => {
  it("derives the governance subaccount and stake memo for create_neuron", async () => {
    const prepared = await prepareTransaction(account, tx({ type: "create_neuron" }));
    expect(prepared.recipient).toMatch(/^[0-9a-f]{64}$/);
    // The memo is the nonce that derived the subaccount (a finite integer string).
    expect(BigNumber(prepared.memo ?? "NaN").isFinite()).toBe(true);
  });

  it("routes increase_stake to the neuron account and recovers the verified stake memo", async () => {
    const controller = derivePrincipalFromPubkey(XPUB);
    const accountIdentifier = getNeuronStakeSubAccountIdentifier(controller, 42n);
    const neuron = { id: 7n, accountIdentifier } as ICPNeuron;
    const accountWithNeuron = {
      ...account,
      neurons: new NeuronsData([neuron], 0),
      operations: [
        { type: "STAKE_NEURON", recipients: [accountIdentifier], extra: { memo: "42" } },
      ],
    } as any;

    const prepared = await prepareTransaction(
      accountWithNeuron,
      tx({ type: "increase_stake", neuronId: "7" }),
    );
    expect(prepared.recipient).toBe(accountIdentifier);
    expect(prepared.stakeNonce).toBe("42");
    // The top-up transfer itself carries no memo (so sync classifies it TOP_UP_NEURON).
    expect(prepared.memo).toBeUndefined();
  });

  it("clears a stale memo on increase_stake so the top-up stays TOP_UP_NEURON", async () => {
    const controller = derivePrincipalFromPubkey(XPUB);
    const accountIdentifier = getNeuronStakeSubAccountIdentifier(controller, 42n);
    const neuron = { id: 7n, accountIdentifier } as ICPNeuron;
    const accountWithNeuron = {
      ...account,
      neurons: new NeuronsData([neuron], 0),
      operations: [
        { type: "STAKE_NEURON", recipients: [accountIdentifier], extra: { memo: "42" } },
      ],
    } as any;

    // A non-zero memo carried in from another flow (e.g. a send) must not survive into the top-up.
    const prepared = await prepareTransaction(
      accountWithNeuron,
      tx({ type: "increase_stake", neuronId: "7", memo: "999" }),
    );
    expect(prepared.memo).toBeUndefined();
  });

  it("leaves the stake nonce unset for increase_stake when it is not recoverable", async () => {
    const controller = derivePrincipalFromPubkey(XPUB);
    const accountIdentifier = getNeuronStakeSubAccountIdentifier(controller, 42n);
    const neuron = { id: 7n, accountIdentifier } as ICPNeuron;
    const accountWithNeuron = {
      ...account,
      neurons: new NeuronsData([neuron], 0),
      operations: [], // no creating stake transfer in history
    } as any;

    const prepared = await prepareTransaction(
      accountWithNeuron,
      tx({ type: "increase_stake", neuronId: "7" }),
    );
    expect(prepared.recipient).toBe(accountIdentifier);
    expect(prepared.stakeNonce).toBeUndefined();
  });

  it("leaves a governance operation unchanged", async () => {
    const original = tx({ type: "start_dissolving", neuronId: "7" });
    expect(await prepareTransaction(account, original)).toEqual(original);
  });
});
