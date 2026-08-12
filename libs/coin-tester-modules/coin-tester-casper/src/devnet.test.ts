import console from "console";
import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setCoinConfig } from "@ledgerhq/coin-casper/config";
import {
  fetchAccountStateInfo,
  fetchBalance,
  fetchLastBlock,
} from "@ledgerhq/coin-casper/network/api";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES } from "@ledgerhq/coin-casper/constants";
import { DEVNET_SANITY_USER_INDEX, GENESIS_USER_BALANCE_MOTES, localCoinConfig } from "./fixtures";
import { deriveUser, nativeTransferMinimumMotes, rawAccountInfo } from "./casperDevnet";

global.console = console;
jest.setTimeout(600_000);

describe("Casper devnet infrastructure", () => {
  let userPublicKey: string;
  let userAccountHash: string;

  beforeAll(async () => {
    setCoinConfig(() => localCoinConfig);
    LiveConfig.setConfig({
      config_currency_casper: {
        type: "object",
        default: localCoinConfig,
      },
    });
    const user = await deriveUser(DEVNET_SANITY_USER_INDEX);
    userPublicKey = user.publicKey;
    userAccountHash = user.accountHash;
  });

  it("serves JSON-RPC to the module's own client", async () => {
    const { height } = await fetchLastBlock();
    expect(height).toBeGreaterThan(0);
  });

  it("derives a user key in the format PublicKey.fromHex accepts", () => {
    expect(userPublicKey).toMatch(/^02[0-9a-f]{66}$/);
  });

  it("resolves the genesis user account", async () => {
    const { accountHash, purseUref } = await fetchAccountStateInfo(userPublicKey);

    // fetchAccountStateInfo swallows RPC errors into { undefined, undefined }.
    if (!purseUref || !accountHash) {
      const raw = await rawAccountInfo(userPublicKey);
      throw new Error(
        `fetchAccountStateInfo returned accountHash=${accountHash} purseUref=${purseUref}\n` +
          `raw state_get_account_info response: ${raw}`,
      );
    }

    expect(purseUref).toMatch(/^uref-/);
    console.log(`module accountHash=${accountHash} cli accountHash=${userAccountHash}`);
    expect(accountHash).toBe(userAccountHash);
  });

  it("reads the genesis prefunding through fetchBalance", async () => {
    const { purseUref } = await fetchAccountStateInfo(userPublicKey);
    if (!purseUref) {
      throw new Error("purseUref is undefined — see the account resolution failure above");
    }

    const balance = await fetchBalance(purseUref);

    expect(balance).toBeInstanceOf(BigNumber);
    expect(balance.toFixed()).toBe(GENESIS_USER_BALANCE_MOTES.toFixed());
  });

  it("the declared native_transfer_minimum_motes equals CASPER_MINIMUM_VALID_AMOUNT_MOTES", async () => {
    const declaredMotes = await nativeTransferMinimumMotes();

    expect(new BigNumber(declaredMotes).toFixed()).toBe(
      new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES).toFixed(),
    );
  });
});
