import BigNumber from "bignumber.js";
import { AccountDataNotServedError } from "@domain/api-account-data";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { mockTronAccount } from "./accountData.mock";
import { readTronResources, toTronResources } from "./accountData";

const account = mockTronAccount({
  energy: new BigNumber(1200),
  bandwidth: {
    freeUsed: new BigNumber(100),
    freeLimit: new BigNumber(600),
    gainedUsed: new BigNumber(30),
    gainedLimit: new BigNumber(200),
  },
  tronPower: 42,
  frozen: { bandwidth: { amount: new BigNumber(7) }, energy: null },
});

const resources = {
  energy: "1200",
  bandwidth: { freeUsed: "100", freeLimit: "600", gainedUsed: "30", gainedLimit: "200" },
  tronPower: 42,
};

const targetOf = (network: string) => {
  const descriptor = mockAddressAccountDescriptor({ network });
  return { descriptor, accountUUID: computeAccountUUID(descriptor) };
};

describe("toTronResources", () => {
  it("maps energy, bandwidth and Tron power, without the frozen amounts", () => {
    expect(toTronResources(account)).toEqual(resources);
  });

  it("answers zero energy when usage is above the limit", () => {
    const overused = mockTronAccount({ ...account.tronResources, energy: new BigNumber(-50) });
    expect(toTronResources(overused)).toEqual({ ...resources, energy: "0" });
  });

  it("rejects an account without Tron resources as not served", () => {
    expect(() =>
      toTronResources(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toThrow(AccountDataNotServedError);
  });
});

describe("readTronResources", () => {
  it("syncs a Tron account and maps it", async () => {
    const sync = jest.fn(async () => account);
    await expect(readTronResources(targetOf("tron"), sync)).resolves.toEqual(resources);
  });

  it("rejects another network as not served, without syncing it", async () => {
    const sync = jest.fn(async () => account);
    await expect(readTronResources(targetOf("ethereum"), sync)).rejects.toBeInstanceOf(
      AccountDataNotServedError,
    );
    expect(sync).not.toHaveBeenCalled();
  });
});
