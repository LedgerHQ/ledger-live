import { getBindingTypedData } from "../binding";
import {
  createPredictionsSigner,
  createSigningRequests,
  type PredictionsSigningRequest,
} from "../signingRequests";

type Account = { id: string; address: string };

const ACCOUNT: Account = { id: "account-1", address: "0x9858EfFD232B4033E47d90003D41EC34EcaEda94" };
const TYPED_DATA = getBindingTypedData(ACCOUNT.address);
const SIGNATURE = "0xsigned";
const typedDataFor = (account: Account) => getBindingTypedData(account.address);

class Refusal extends Error {
  override name = "UserRefusedOnDevice";
}

function setup() {
  const requests = createSigningRequests<Account>();
  const opened: PredictionsSigningRequest<Account>[] = [];
  const root = { open: jest.fn(request => opened.push(request)), cancel: jest.fn() };
  const unregister = requests.register(root);
  const onSigned = jest.fn();
  const signer = createPredictionsSigner({
    requests,
    purpose: "binding",
    findAccount: () => ACCOUNT,
    onSigned,
    refusal: () => new Refusal(),
  });
  const lastRequest = () => {
    const request = opened.at(-1);
    if (!request) throw new Error("No signature opened");
    return request;
  };
  return { requests, root, unregister, onSigned, signer, lastRequest };
}

describe("createSigningRequests", () => {
  it("fails a binding right away when no root is mounted", () => {
    const requests = createSigningRequests<Account>();
    const onError = jest.fn();

    requests.open({
      account: ACCOUNT,
      purpose: "binding",
      typedData: TYPED_DATA,
      onSuccess: jest.fn(),
      onError,
      onCancel: jest.fn(),
    });

    expect(onError).toHaveBeenCalledWith(new Error("The Predictions binding isn't mounted"));
  });

  it("keeps a root registered since when an older one unregisters", () => {
    const requests = createSigningRequests<Account>();
    const unregisterOld = requests.register({ open: jest.fn(), cancel: jest.fn() });
    const newRoot = { open: jest.fn(), cancel: jest.fn() };
    requests.register(newRoot);
    const request: PredictionsSigningRequest<Account> = {
      account: ACCOUNT,
      purpose: "binding",
      typedData: TYPED_DATA,
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
    };

    unregisterOld();
    requests.open(request);

    expect(newRoot.open).toHaveBeenCalledWith(request);
  });
});

describe("createPredictionsSigner", () => {
  it("opens the prompt for the account's typed data and answers once signed, after onSigned", async () => {
    const { signer, onSigned, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1", typedDataFor);
    expect(lastRequest()).toMatchObject({
      account: ACCOUNT,
      purpose: "binding",
      typedData: TYPED_DATA,
    });
    lastRequest().onSuccess(SIGNATURE);

    await expect(signing).resolves.toEqual({ typedData: TYPED_DATA, signature: SIGNATURE });
    expect(onSigned).toHaveBeenCalledTimes(1);
  });

  it("rejects with the refusal when the binding closes unsigned", async () => {
    const { signer, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1", typedDataFor);
    lastRequest().onCancel();

    await expect(signing).rejects.toBeInstanceOf(Refusal);
  });

  it("keeps the first answer: a signature after a cancel opens no setup", async () => {
    const { signer, onSigned, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1", typedDataFor);
    lastRequest().onCancel();
    lastRequest().onSuccess(SIGNATURE);

    await expect(signing).rejects.toBeInstanceOf(Refusal);
    expect(onSigned).not.toHaveBeenCalled();
  });

  it("rejects with the executor's error", async () => {
    const { signer, lastRequest } = setup();
    const error = new Error("init failed");

    const signing = signer.sign("wallet-account-1", typedDataFor);
    lastRequest().onError(error);

    await expect(signing).rejects.toBe(error);
  });

  it("fails without opening anything when the account can't sign the binding", () => {
    const { requests, root } = setup();
    const signer = createPredictionsSigner({
      requests,
      purpose: "binding",
      findAccount: () => {
        throw new Error("No EVM account");
      },
      onSigned: jest.fn(),
      refusal: () => new Refusal(),
    });

    expect(() => signer.sign("unknown", typedDataFor)).toThrow("No EVM account");
    expect(root.open).not.toHaveBeenCalled();
  });

  it("cancels only the binding it opened", () => {
    const { requests, root, signer, lastRequest } = setup();
    const otherPlayer = createPredictionsSigner({
      requests,
      purpose: "binding",
      findAccount: () => ACCOUNT,
      onSigned: jest.fn(),
      refusal: () => new Refusal(),
    });

    otherPlayer.cancelOpened();
    expect(root.cancel).not.toHaveBeenCalled();
    void signer.sign("wallet-account-1", typedDataFor).catch(() => undefined);
    signer.cancelOpened();

    expect(root.cancel).toHaveBeenCalledWith(lastRequest());
  });
});
