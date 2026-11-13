import type { PredictionsBindingAnswer } from "../binding";
import {
  createBindingRequests,
  createBindingSigner,
  type PredictionsBindingRequest,
} from "../bindingRequests";

type Account = { id: string };

const ACCOUNT: Account = { id: "account-1" };
const ANSWER = { signature: "0xsigned" } as unknown as PredictionsBindingAnswer;

class Refusal extends Error {
  override name = "UserRefusedOnDevice";
}

function setup() {
  const requests = createBindingRequests<Account>();
  const opened: PredictionsBindingRequest<Account>[] = [];
  const root = { open: jest.fn(request => opened.push(request)), cancel: jest.fn() };
  const unregister = requests.register(root);
  const onSigned = jest.fn();
  const signer = createBindingSigner({
    requests,
    findAccount: () => ACCOUNT,
    onSigned,
    refusal: () => new Refusal(),
  });
  const lastRequest = () => {
    const request = opened.at(-1);
    if (!request) throw new Error("No binding opened");
    return request;
  };
  return { requests, root, unregister, onSigned, signer, lastRequest };
}

describe("createBindingRequests", () => {
  it("fails a binding right away when no root is mounted", () => {
    const requests = createBindingRequests<Account>();
    const onError = jest.fn();

    requests.open({ account: ACCOUNT, onSuccess: jest.fn(), onError, onCancel: jest.fn() });

    expect(onError).toHaveBeenCalledWith(new Error("The Predictions binding isn't mounted"));
  });

  it("keeps a root registered since when an older one unregisters", () => {
    const requests = createBindingRequests<Account>();
    const unregisterOld = requests.register({ open: jest.fn(), cancel: jest.fn() });
    const newRoot = { open: jest.fn(), cancel: jest.fn() };
    requests.register(newRoot);
    const request = {
      account: ACCOUNT,
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
    };

    unregisterOld();
    requests.open(request);

    expect(newRoot.open).toHaveBeenCalledWith(request);
  });
});

describe("createBindingSigner", () => {
  it("opens the binding for the account and answers once signed, after onSigned", async () => {
    const { signer, onSigned, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1");
    expect(lastRequest().account).toBe(ACCOUNT);
    lastRequest().onSuccess(ANSWER);

    await expect(signing).resolves.toBe(ANSWER);
    expect(onSigned).toHaveBeenCalledTimes(1);
  });

  it("rejects with the refusal when the binding closes unsigned", async () => {
    const { signer, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1");
    lastRequest().onCancel();

    await expect(signing).rejects.toBeInstanceOf(Refusal);
  });

  it("keeps the first answer: a signature after a cancel opens no setup", async () => {
    const { signer, onSigned, lastRequest } = setup();

    const signing = signer.sign("wallet-account-1");
    lastRequest().onCancel();
    lastRequest().onSuccess(ANSWER);

    await expect(signing).rejects.toBeInstanceOf(Refusal);
    expect(onSigned).not.toHaveBeenCalled();
  });

  it("rejects with the executor's error", async () => {
    const { signer, lastRequest } = setup();
    const error = new Error("init failed");

    const signing = signer.sign("wallet-account-1");
    lastRequest().onError(error);

    await expect(signing).rejects.toBe(error);
  });

  it("fails without opening anything when the account can't sign the binding", () => {
    const { requests, root } = setup();
    const signer = createBindingSigner({
      requests,
      findAccount: () => {
        throw new Error("No EVM account");
      },
      onSigned: jest.fn(),
      refusal: () => new Refusal(),
    });

    expect(() => signer.sign("unknown")).toThrow("No EVM account");
    expect(root.open).not.toHaveBeenCalled();
  });

  it("cancels only the binding it opened", () => {
    const { requests, root, signer, lastRequest } = setup();
    const otherPlayer = createBindingSigner({
      requests,
      findAccount: () => ACCOUNT,
      onSigned: jest.fn(),
      refusal: () => new Refusal(),
    });

    otherPlayer.cancelOpened();
    expect(root.cancel).not.toHaveBeenCalled();
    void signer.sign("wallet-account-1").catch(() => undefined);
    signer.cancelOpened();

    expect(root.cancel).toHaveBeenCalledWith(lastRequest());
  });
});
