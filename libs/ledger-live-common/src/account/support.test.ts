import { getCryptoCurrencyById } from "../currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "../bridge";
import {
  canReceive,
  canSend,
  isReceiveDisabledForFamily,
  isSendDisabledForFamily,
} from "./support";

jest.mock("../bridge");
const mockGetAccountBridge = jest.mocked(getAccountBridge);

const ethAccount = genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }) as Account;
const hypercoreAccount = genAccount("hc", {
  currency: getCryptoCurrencyById("hypercore"),
}) as Account;

const bridgeWith = (createTransaction: jest.Mock) =>
  ({ createTransaction }) as unknown as ReturnType<typeof getAccountBridge>;

beforeEach(() => jest.clearAllMocks());

describe("family transfer capability", () => {
  it("disables send and receive for hypercore, allows them for other families", () => {
    expect(isSendDisabledForFamily("hypercore")).toBe(true);
    expect(isReceiveDisabledForFamily("hypercore")).toBe(true);
    expect(isSendDisabledForFamily("ethereum")).toBe(false);
    expect(isReceiveDisabledForFamily("ethereum")).toBe(false);
  });

  it("canReceive follows the family capability", () => {
    expect(canReceive(hypercoreAccount, undefined)).toBe(false);
    expect(canReceive(ethAccount, undefined)).toBe(true);
  });
});

describe("canSend", () => {
  it("short-circuits to false for send-disabled families without probing the bridge", async () => {
    await expect(canSend(hypercoreAccount, undefined)).resolves.toBe(false);
    expect(mockGetAccountBridge).not.toHaveBeenCalled();
  });

  it("probes the bridge for other families", async () => {
    const createTransaction = jest.fn();
    mockGetAccountBridge.mockReturnValue(bridgeWith(createTransaction));
    await expect(canSend(ethAccount, undefined)).resolves.toBe(true);
    expect(mockGetAccountBridge).toHaveBeenCalled();
    expect(createTransaction).toHaveBeenCalled();
  });

  it("returns false when building a transaction throws", async () => {
    mockGetAccountBridge.mockReturnValue(
      bridgeWith(
        jest.fn(() => {
          throw new Error("cannot build");
        }),
      ),
    );
    await expect(canSend(ethAccount, undefined)).resolves.toBe(false);
  });
});
