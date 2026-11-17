import { Observable } from "rxjs";
import {
  ApduResponse,
  DeviceActionStatus,
  UserInteractionRequired,
  type DeviceActionState,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import { MockDeviceManagementKit } from "../device/mock-dmk";
import { _setTestDmkTransport } from "../device/register-dmk-transport";
import { WalletCliDmkTransport } from "../device/wallet-cli-dmk-transport";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "./constants";

/** The nonce the Exchange app hands out for a legacy (10-byte) swap. */
export const EXCHANGE_NONCE = "SWAPNONCE1";

/** Valid secp256k1 `r`, `s` for chain 1: the Ethereum app's answer to any transaction. */
const ETHEREUM_SIGNATURE = {
  r: "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
  s: `0x${"22".repeat(32)}`,
  v: 37,
};
const SOLANA_SIGNATURE = new Uint8Array(64).fill(0x11);
const ETH_REFUSED = { _tag: "EthAppCommandError", errorCode: "6985", message: "Denied by user" };

const EXCHANGE_START_NEW_TRANSACTION = 0x03;
const EXCHANGE_LEGACY_SWAP = 0x00;
const SOLANA_GET_PUBKEY = 0x05;
const SOLANA_SIGN = 0x06;
const SOLANA_P2_EXTEND = 0x01;
const SOLANA_P2_MORE = 0x02;
const HARDENED = 0x80000000;
const OK = new Uint8Array([0x90, 0x00]);
const DENIED = new Uint8Array([0x69, 0x85]);

type ActionState = DeviceActionState<unknown, unknown, unknown>;

function deviceAction<Output, Error, Intermediate>(
  ...states: ActionState[]
): ExecuteDeviceActionReturnType<Output, Error, Intermediate> {
  const observable = new Observable<DeviceActionState<Output, Error, Intermediate>>(subscriber => {
    for (const state of states)
      subscriber.next(state as DeviceActionState<Output, Error, Intermediate>);
    subscriber.complete();
  });
  return { observable, cancel: () => {} };
}

const completed = (output: unknown): ActionState => ({
  status: DeviceActionStatus.Completed,
  output,
});
const failed = (error: unknown): ActionState => ({ status: DeviceActionStatus.Error, error });
const awaitingApproval: ActionState = {
  status: DeviceActionStatus.Pending,
  intermediateValue: { requiredUserInteraction: UserInteractionRequired.SignTransaction },
};

function answer(data: Uint8Array, statusCode: Uint8Array): Promise<ApduResponse> {
  return Promise.resolve(new ApduResponse({ statusCode, data }));
}

/** The first derivation path of a Solana sign APDU's first chunk, e.g. `44'/501'/0'/0'`. */
function solanaSignerPath(data: Uint8Array): string {
  const view = Buffer.from(data);
  const length = view[1];
  return Array.from({ length }, (_, i) => {
    const index = view.readUInt32BE(2 + 4 * i);
    return index >= HARDENED ? `${index - HARDENED}'` : String(index);
  }).join("/");
}

/**
 * A Ledger for `_setTestDmkTransport`, with the Exchange, Ethereum and plugin apps, and the Solana
 * app for `solanaAddress`. It opens any app but `refuseToOpen`, starts Exchange transactions, and
 * signs every transaction and typed message once the user approves, unless `refuseToSign`.
 * `events` records what the CLI asked of it, in order, e.g. `open Ethereum with Kiln`,
 * `sign 44'/60'/0'/0/0`, `sign typed data …`, `start Exchange transaction`, `close session`.
 * `"no-device-model"` hides which model it is.
 */
export class FakeLedger extends MockDeviceManagementKit {
  readonly events: string[] = [];
  /** Unsigned Ethereum transactions it signed, as hex. */
  readonly signedTransactions: string[] = [];
  /** `unlockTimeout` of each app the CLI opened, in order. */
  readonly unlockTimeouts: (number | undefined)[] = [];
  refuseToOpen: string | undefined;
  refuseToSign = false;
  private readonly solanaAddress: string | undefined;
  /** Path of the Solana message being sent in chunks. */
  private solanaSigner = "";

  constructor({
    solanaAddress,
    initialState,
  }: { solanaAddress?: string; initialState?: "no-device-model" } = {}) {
    super({
      initialState,
      appResults: { Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS } },
    });
    this.solanaAddress = solanaAddress;
  }

  /** Makes it the CLI's device; returns the undo. */
  install(): () => void {
    const previous = _setTestDmkTransport(
      new WalletCliDmkTransport(this as never, "mock-session-id"),
    );
    return () => {
      _setTestDmkTransport(previous);
    };
  }

  override executeDeviceAction<Output, Error, Intermediate, Input>(args: {
    sessionId: string;
    deviceAction: { input: Input };
  }): ExecuteDeviceActionReturnType<Output, Error, Intermediate> {
    const input = args.deviceAction.input as Record<string, unknown>;
    const application = input.application as { name: string } | undefined;
    if (application) {
      const dependencies = (input.dependencies as { name: string }[] | undefined) ?? [];
      const plugins = dependencies.map(({ name }) => name).join(", ");
      this.events.push(`open ${application.name}${plugins ? ` with ${plugins}` : ""}`);
      this.unlockTimeouts.push(input.unlockTimeout as number | undefined);
      return this.refuseToOpen === application.name
        ? deviceAction(failed({ _tag: "RefusedByUserDAError" }))
        : deviceAction(completed({}));
    }
    if (typeof input.derivationPath !== "string") {
      return super.executeDeviceAction(args as never) as ExecuteDeviceActionReturnType<
        Output,
        Error,
        Intermediate
      >;
    }
    const isTransaction = input.transaction instanceof Uint8Array;
    this.events.push(`${isTransaction ? "sign" : "sign typed data"} ${input.derivationPath}`);
    if (this.refuseToSign) return deviceAction(failed(ETH_REFUSED));
    if (isTransaction) {
      this.signedTransactions.push(Buffer.from(input.transaction as Uint8Array).toString("hex"));
    }
    return deviceAction(awaitingApproval, completed(ETHEREUM_SIGNATURE));
  }

  getConnectedDevice(_args: { sessionId: string }) {
    return { id: "mock-device-id", name: "Ledger Nano S Plus (mock)", type: "USB" };
  }

  override sendApdu(args: {
    sessionId?: string;
    apdu: Uint8Array;
    abortTimeout?: number;
  }): Promise<ApduResponse> {
    const [, ins, p1, p2] = args.apdu;
    // The Solana app and the Exchange app share instruction codes.
    if (this.solanaAddress !== undefined) {
      if (ins === SOLANA_GET_PUBKEY) return answer(base58Decode(this.solanaAddress), OK);
      if (ins === SOLANA_SIGN) return this.solanaSign(args.apdu.subarray(5), p2);
    } else if (ins === EXCHANGE_START_NEW_TRANSACTION) {
      this.events.push("start Exchange transaction");
      const nonce = p1 === EXCHANGE_LEGACY_SWAP ? Buffer.from(EXCHANGE_NONCE) : Buffer.alloc(32, 7);
      return answer(new Uint8Array(nonce), OK);
    }
    return super.sendApdu(args);
  }

  /** The message comes in chunks; only the last one, without P2_MORE, gets the signature. */
  private solanaSign(data: Uint8Array, p2: number): Promise<ApduResponse> {
    if (!(p2 & SOLANA_P2_EXTEND)) this.solanaSigner = solanaSignerPath(data);
    if (p2 & SOLANA_P2_MORE) return answer(new Uint8Array(0), OK);
    this.events.push(`sign ${this.solanaSigner}`);
    return this.refuseToSign ? answer(new Uint8Array(0), DENIED) : answer(SOLANA_SIGNATURE, OK);
  }

  override disconnect(args: unknown): Promise<void> {
    this.events.push("close session");
    return super.disconnect(args);
  }
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** The base58 Solana signature `FakeLedger` gives every transaction. */
export const FAKE_LEDGER_SOLANA_SIGNATURE = (() => {
  let value = SOLANA_SIGNATURE.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);
  let text = "";
  while (value > 0n) {
    text = BASE58[Number(value % 58n)] + text;
    value /= 58n;
  }
  return text;
})();

/** The 32 bytes a Solana address encodes. */
export function base58Decode(address: string): Uint8Array {
  let value = 0n;
  for (const char of address) value = value * 58n + BigInt(BASE58.indexOf(char));
  const bytes = new Uint8Array(32);
  for (let i = 31; i >= 0; i -= 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return bytes;
}
