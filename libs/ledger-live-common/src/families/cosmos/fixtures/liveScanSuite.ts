import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { isAccountBalanceUnconfirmed } from "../../../account";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./deviceApdus";
import { CHAINS_WITH_PARSED_HISTORY, HUB_KNOWN_OPERATION_HASH } from "./knownHistory";
import { balancesAreCoherent } from "./balanceCoherence";
import { scanRecordedDevicePrefix } from "./recordedDeviceScan";

export const describeLiveScan = (chains: DeviceChainFixture[]): void => {
  describe.each(chains)("cosmos generic scanAccounts of $currencyId on the live chain", chain => {
    let accounts: Account[];

    beforeAll(async () => {
      accounts = await scanRecordedDevicePrefix(chain);
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

    it("flags used the first account of the device", () => {
      expect([accounts[0].freshAddress, accounts[0].used]).toEqual([
        chain.accounts[0].address,
        true,
      ]);
    });

    it("carries no sub account", () => {
      expect(accounts.map(a => a.subAccounts)).toEqual(accounts.map(() => []));
    });

    it("reports for every discovered account a balance equal to its spendable, delegated and unbonding balances", () => {
      expect(accounts.map(balancesAreCoherent)).toEqual(
        accounts.map(() => [true, true, true, true]),
      );
    });
  });
};

export const describeCosmosHubScanHistory = (): void => {
  describe("cosmos generic scanAccounts history on the Cosmos Hub", () => {
    const hub = DEVICE_CHAINS.find(({ currencyId }) => CHAINS_WITH_PARSED_HISTORY.has(currencyId));
    invariant(hub, "a chain with a parsed history is expected");
    let accounts: Account[];

    beforeAll(async () => {
      accounts = await scanRecordedDevicePrefix(hub);
    });

    it("flags the first account used and lists the known historical operation", () => {
      expect({
        used: accounts[0].used,
        knowsHistory: accounts[0].operations.some(op => op.hash === HUB_KNOWN_OPERATION_HASH),
      }).toEqual({ used: true, knowsHistory: true });
    });

    it("has no unconfirmed account among accounts that have operations", () => {
      const unconfirmed = accounts
        .filter(a => a.operations.length > 0)
        .map(a => isAccountBalanceUnconfirmed(a));

      expect({
        hasOperations: unconfirmed.length > 0,
        anyUnconfirmed: unconfirmed.includes(true),
      }).toEqual({ hasOperations: true, anyUnconfirmed: false });
    });

    it("dates the creation of each account no later than its oldest operation", () => {
      const dated = accounts.flatMap(a =>
        a.operations.slice(-1).map(op => a.creationDate.getTime() <= op.date.getTime()),
      );

      expect({ hasOperations: dated.length > 0, allDatedInOrder: !dated.includes(false) }).toEqual({
        hasOperations: true,
        allDatedInOrder: true,
      });
    });
  });
};
