import cosmosResolver from "@ledgerhq/coin-cosmos/hw-getAddress";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import invariant from "invariant";
import { identity, lastValueFrom, take, toArray, type MonoTypeOperatorFunction } from "rxjs";
import { getCoinFrameworkCurrencyBridge } from "../../../bridge/generic-coin-framework/currencyBridge";
import type { CoinFrameworkSigner } from "../../../bridge/generic-coin-framework/types";
import type { DeviceChainFixture } from "./deviceApdus";
import { createSigner } from "../setup";

const NO_SIGNER: unknown = undefined;

const buildRecordedDeviceSigner = ({ accounts }: DeviceChainFixture): CoinFrameworkSigner => ({
  getAddress: async (_deviceId, { currency, path }) => {
    const recorded = accounts.find(
      account => account.path === path || account.path === `${path}/0/0`,
    );
    invariant(recorded, `no recorded device exchange for ${path}`);
    const transport = await openTransportReplayer(RecordStore.fromString(recorded.apdus));
    const signer = createSigner(transport);
    return cosmosResolver((_id, job) => job(signer))("device", {
      currency,
      path,
      derivationMode: "",
    });
  },
  context: (_deviceId, fn) => fn(NO_SIGNER),
});

const scanWith = async (
  chain: DeviceChainFixture,
  bound: MonoTypeOperatorFunction<ScanAccountEvent>,
): Promise<Account[]> => {
  const bridge = await getCoinFrameworkCurrencyBridge(
    "cosmos",
    "local",
    buildRecordedDeviceSigner(chain),
  );
  const events = await lastValueFrom(
    bridge
      .scanAccounts({
        currency: getCryptoCurrencyById(chain.currencyId),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(bound, toArray()),
  );
  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account);
};

export const scanRecordedDevice = (chain: DeviceChainFixture): Promise<Account[]> =>
  scanWith(chain, identity);

export const scanRecordedDevicePrefix = (chain: DeviceChainFixture): Promise<Account[]> =>
  scanWith(chain, take(chain.accounts.length));
