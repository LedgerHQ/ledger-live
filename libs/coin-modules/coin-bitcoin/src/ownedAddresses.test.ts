import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { IExplorer } from "@ledgerhq/wallet-btc/explorer/types";
import BitcoinLikeStorage from "@ledgerhq/wallet-btc/storage/index";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import Xpub from "@ledgerhq/wallet-btc/xpub";
import { getOwnedAddresses } from "./ownedAddresses";

const makeAccount = (
  freshAddress: string,
  xpub?: { storedAddresses: string[]; nextChangeAddress: string },
) => {
  const getNewAddress = jest.fn().mockResolvedValue({ address: xpub?.nextChangeAddress });
  const walletAccount = xpub && {
    xpub: {
      getXpubAddresses: jest
        .fn()
        .mockResolvedValue(xpub.storedAddresses.map(address => ({ address }))),
      getNewAddress,
    },
  };
  const account = {
    freshAddress,
    bitcoinResources: { utxos: [], walletAccount },
  } as unknown as Account;
  return { account, getNewAddress };
};

describe("getOwnedAddresses", () => {
  it("returns the stored, fresh receive and next change addresses", async () => {
    const { account } = makeAccount("bc1receive2", {
      storedAddresses: ["bc1receive0", "bc1receive1", "bc1change0"],
      nextChangeAddress: "bc1change1",
    });

    expect(await getOwnedAddresses(account)).toEqual([
      "bc1receive0",
      "bc1receive1",
      "bc1change0",
      "bc1receive2",
      "bc1change1",
    ]);
  });

  it("derives the next change address on the change chain", async () => {
    const { account, getNewAddress } = makeAccount("bc1receive0", {
      storedAddresses: [],
      nextChangeAddress: "bc1change0",
    });

    await getOwnedAddresses(account);

    expect(getNewAddress).toHaveBeenCalledWith(1, 1);
  });

  it("does not repeat an address", async () => {
    const { account } = makeAccount("bc1receive0", {
      storedAddresses: ["bc1receive0"],
      nextChangeAddress: "bc1change0",
    });

    expect(await getOwnedAddresses(account)).toEqual(["bc1receive0", "bc1change0"]);
  });

  it("falls back to the fresh address when the wallet account is not loaded", async () => {
    const { account } = makeAccount("bc1receive0");

    expect(await getOwnedAddresses(account)).toEqual(["bc1receive0"]);
  });

  it("returns nothing for an account without any address", async () => {
    const { account } = makeAccount("");

    expect(await getOwnedAddresses(account)).toEqual([]);
  });

  it("derives the addresses of a synced wallet account", async () => {
    const crypto = cryptoFactory("bitcoin");
    const xpubKey =
      "xpub6Co7wRMSsree1cGESqdgi4BpcVDgdJfjUWqY8M6Dnh3N1NmphcSwhbRoUA2nitgsJxd7gqhSTbSbXf3uAD4q4FqbCsKSGEpw5ab3DS7TtM2";
    const derive = (chain: number, index: number) =>
      crypto.getAddress(DerivationModes.NATIVE_SEGWIT, xpubKey, chain, index);
    const storage = new BitcoinLikeStorage();
    const usedPaths = [
      [0, 0],
      [0, 1],
      [1, 0],
    ];
    const txs: TX[] = await Promise.all(
      usedPaths.map(async ([chain, index]) => ({
        id: `tx-${chain}-${index}`,
        inputs: [],
        outputs: [],
        block: { hash: "block", height: 1, time: "2026-01-01T00:00:00Z" },
        account: chain,
        index,
        address: await derive(chain, index),
        received_at: "2026-01-01T00:00:00Z",
      })),
    );
    storage.appendTxs(jest.fn(), txs);
    const xpub = new Xpub({
      storage,
      explorer: {} as IExplorer,
      crypto,
      xpub: xpubKey,
      derivationMode: DerivationModes.NATIVE_SEGWIT,
    });
    const account = {
      freshAddress: await derive(0, 2),
      bitcoinResources: { utxos: [], walletAccount: { xpub } },
    } as unknown as Account;

    expect(await getOwnedAddresses(account)).toEqual([
      await derive(0, 0),
      await derive(0, 1),
      await derive(1, 0),
      await derive(0, 2),
      await derive(1, 1),
    ]);
  });
});
