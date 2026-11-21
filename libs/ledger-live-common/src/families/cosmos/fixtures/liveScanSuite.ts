import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { isAccountBalanceUnconfirmed } from "../../../account";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./deviceApdus";
import { readLcdBalances } from "./lcdBalances";
import { scanRecordedDevice } from "./recordedDeviceScan";

const withinTolerance = (value: BigNumber, reference: BigNumber) =>
  value.minus(reference).abs().isLessThanOrEqualTo(reference.times(0.01));

export const describeLiveScan = (chains: DeviceChainFixture[]): void => {
  describe.each(chains)("cosmos generic scanAccounts of $currencyId on the live chain", chain => {
    let accounts: Account[];

    beforeAll(async () => {
      accounts = await scanRecordedDevice(chain);
    });

    it("derives the id, the keys, the address and the path of each discovered account", () => {
      expect(
        accounts.map(a => ({
          id: a.id,
          xpub: a.xpub,
          seedIdentifier: a.seedIdentifier,
          freshAddress: a.freshAddress,
          freshAddressPath: a.freshAddressPath,
          derivationMode: a.derivationMode,
          index: a.index,
        })),
      ).toEqual(
        chain.accounts.slice(0, accounts.length).map(({ address, publicKey, path }, index) => ({
          id: `js:2:${chain.currencyId}:${address}:`,
          xpub: publicKey,
          seedIdentifier: chain.accounts[0].publicKey,
          freshAddress: address,
          freshAddressPath: path,
          derivationMode: "",
          index,
        })),
      );
    });

    it("discovers the first account of the device", () => {
      expect(accounts[0].freshAddress).toBe(chain.accounts[0].address);
    });

    it("flags every account used but the last one, which is the empty account to create", () => {
      expect(accounts.slice(0, -1).map(a => a.used)).not.toContain(false);
      expect(accounts.at(-1)?.used).toBe(false);
    });

    it("has no unconfirmed account", () => {
      expect(accounts.map(a => isAccountBalanceUnconfirmed(a))).not.toContain(true);
    });

    it("dates the creation of each account no later than its oldest operation", () => {
      expect(
        accounts.flatMap(a =>
          a.operations.slice(-1).map(op => a.creationDate.getTime() <= op.date.getTime()),
        ),
      ).not.toContain(false);
    });

    it("carries no sub account", () => {
      expect(accounts.map(a => a.subAccounts)).toEqual(accounts.map(() => []));
    });

    it("only proposes an account the chain holds nothing on as the empty account to create", async () => {
      const lastBalances = await Promise.all(
        accounts.slice(-1).map(a => readLcdBalances(chain.currencyId, a.freshAddress)),
      );

      expect(lastBalances.map(balances => balances.balance.isZero())).toEqual([true]);
    });

    it("holds funds on the first account", () => {
      expect(accounts[0].balance.isGreaterThan(0)).toBe(true);
    });

    it("reports, for every discovered account, a balance and a spendable balance close to an independent read of the chain", async () => {
      const independent = await Promise.all(
        accounts.map(a => readLcdBalances(chain.currencyId, a.freshAddress)),
      );

      expect(
        accounts.map(
          (a, index) =>
            withinTolerance(a.balance, independent[index].balance) &&
            withinTolerance(a.spendableBalance, independent[index].spendableBalance),
        ),
      ).toEqual(accounts.map(() => true));
    });

    it("keeps the spendable balance within the balance on every account", () => {
      expect(accounts.map(a => a.spendableBalance.isLessThanOrEqualTo(a.balance))).not.toContain(
        false,
      );
    });
  });
};

export const describeCosmosHubScanHistory = (): void => {
  describe("cosmos generic scanAccounts history on the Cosmos Hub", () => {
    const [hub] = DEVICE_CHAINS;
    let accounts: Account[];

    beforeAll(async () => {
      accounts = await scanRecordedDevice(hub);
    });

    it("lists the operations of the first account, which is used", () => {
      expect({
        used: accounts[0].used,
        hasOperations: accounts[0].operations.length > 0,
        operationsCount: accounts[0].operationsCount,
      }).toEqual({
        used: true,
        hasOperations: true,
        operationsCount: accounts[0].operations.length,
      });
    });

    it("keeps every operation on the account it belongs to", () => {
      expect(
        accounts.flatMap(a =>
          a.operations.map(op => op.accountId === a.id && op.id.startsWith(`${a.id}-`)),
        ),
      ).not.toContain(false);
    });
  });
};
