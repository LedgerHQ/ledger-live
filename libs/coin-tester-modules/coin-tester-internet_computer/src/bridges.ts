import { createBridges } from "@ledgerhq/coin-internet_computer/bridge/index";
import type {
  ICPAccount,
  ICPSigner,
  InternetComputerOperation,
  Transaction,
} from "@ledgerhq/coin-internet_computer/types/index";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { localConfig } from "./fixtures";
import { buildSigner } from "./signer";

type Bridges = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, ICPAccount>;
  /** The operation the last broadcast returned: the runner keeps it only as a pending operation. */
  lastBroadcast: () => InternetComputerOperation | undefined;
};

/** coin-internet_computer's legacy bridges against the local network, with a software signer. */
export function getLegacyBridges(): Bridges {
  const signer = buildSigner();
  const signerContext: SignerContext<ICPSigner> = (_deviceId, fn) => fn(signer);
  const { currencyBridge, accountBridge } = createBridges(signerContext, () => localConfig);

  let last: InternetComputerOperation | undefined;
  const broadcast: typeof accountBridge.broadcast = async args => {
    const operation = await accountBridge.broadcast(args);
    last = operation as InternetComputerOperation;
    return operation;
  };

  return {
    currencyBridge,
    accountBridge: { ...accountBridge, broadcast } as unknown as AccountBridge<
      Transaction,
      ICPAccount
    >,
    lastBroadcast: () => last,
  };
}
