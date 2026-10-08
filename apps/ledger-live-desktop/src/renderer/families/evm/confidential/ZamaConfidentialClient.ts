import {
  ConfidentialError,
  type ConfidentialClient,
  type ConfidentialErrorCode,
  type Handle,
  type Hex,
  type OraclePrepared,
  type PermitStatus,
  type PreparedPermit,
} from "@ledgerhq/coin-evm/confidential";
import {
  BaseSigner,
  MemoryStorage,
  NotEntitledError,
  PreparedPermitChainMismatchError,
  PreparedPermitExpiredError,
  RelayerRequestFailedError,
  RevokedKmsContextError,
  TransportKeyPairChangedError,
  TransportKeyPairExpiredError,
  ZamaSDK,
  createConfig,
  sepolia,
  type FheChain,
  type GenericStorage,
  type PreparedPermit as SdkPreparedPermit,
} from "@zama-fhe/sdk";
import { EthersProvider } from "@zama-fhe/sdk/ethers";
import { web } from "@zama-fhe/sdk/web";

const SECONDS_PER_DAY = 86_400;
const NO_ACCOUNT: Hex = "0x0000000000000000000000000000000000000000";

/** The part of the SDK this client drives, so tests can stand in for it. */
export type ZamaSdkLike = {
  permits: Pick<ZamaSDK["permits"], "hasPermit" | "registerPermit">;
  offline: Pick<ZamaSDK["offline"], "preparePermit">;
  decryption: Pick<ZamaSDK["decryption"], "decryptValues">;
  registry: Pick<ZamaSDK["registry"], "getConfidentialToken">;
};

export type ZamaConfidentialClientOptions = {
  /** JSON-RPC endpoint of the host chain. */
  rpcUrl: string;
  /** Zama relayer, or a passthrough to it. */
  relayerUrl: string;
  /** Attestation service that prepares confidential transfers and vouches for their amounts. */
  oracleUrl: string;
  /** FHE chain preset. Default Sepolia. */
  chain?: FheChain;
  /** Where the SDK keeps permits and transport key pairs. Default in memory. */
  storage?: GenericStorage;
  /** Builds the SDK bound to one account. Default: the Zama SDK with the web relayer. */
  createSdk?: (account: Hex) => ZamaSdkLike;
};

/**
 * The account as the SDK sees it. It refuses to sign: a permit is signed only through
 * preparePermit → device → registerPermit, so the SDK can never prompt the device on its own.
 */
class AccountOnlySigner extends BaseSigner {
  async signTypedData(): Promise<Hex> {
    throw new ConfidentialError("PermitRequired", "permits are signed through preparePermit");
  }
  async writeContract(): Promise<Hex> {
    throw new ConfidentialError("Unknown", "the wallet signs and broadcasts transactions itself");
  }
}

/** EIP-1193 provider over plain JSON-RPC: the SDK only reads the chain through it. */
function jsonRpcProvider(url: string) {
  let id = 0;
  return {
    async request({ method, params }: { method: string; params?: unknown[] }): Promise<unknown> {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params: params ?? [] }),
      });
      const body = await response.json();
      if (body.error) throw Object.assign(new Error(body.error.message), body.error);
      return body.result;
    },
    on() {},
    removeListener() {},
  };
}

function toErrorCode(error: unknown): ConfidentialErrorCode {
  if (error instanceof NotEntitledError) return "AclDenied";
  if (
    error instanceof PreparedPermitExpiredError ||
    error instanceof TransportKeyPairChangedError ||
    error instanceof TransportKeyPairExpiredError
  ) {
    return "PermitExpired";
  }
  if (error instanceof PreparedPermitChainMismatchError) return "PermitChainMismatch";
  if (error instanceof RevokedKmsContextError) return "KmsContextRevoked";
  if (error instanceof RelayerRequestFailedError) return "RelayerError";
  return "Unknown";
}

function toConfidentialError(error: unknown, fields?: { contract?: string; handle?: Handle }) {
  if (error instanceof ConfidentialError) return error;
  const message = error instanceof Error ? error.message : undefined;
  return new ConfidentialError(toErrorCode(error), message, { ...fields, cause: error });
}

const key = (value: string) => value.toLowerCase();

const ORACLE_ERRORS: Record<string, ConfidentialErrorCode> = {
  WRAPPER_NOT_REGISTERED: "WrapperNotRegistered",
  RELAYER_ERROR: "RelayerError",
  RATE_LIMITED: "RelayerError",
};

type OracleTransaction = { unsignedTx: string; handle: Handle };

function isOracleTransaction(value: unknown): value is OracleTransaction {
  if (typeof value !== "object" || value === null) return false;
  const { unsignedTx, handle } = value as Record<string, unknown>;
  return typeof unsignedTx === "string" && typeof handle === "string" && handle.startsWith("0x");
}

/**
 * Confidential-token client backed by the Zama SDK in the renderer. It only bridges to Zama:
 * balance states, amounts and the order of calls belong to coin-evm, which receives this client.
 */
export class ZamaConfidentialClient implements ConfidentialClient {
  private readonly sdks = new Map<string, ZamaSdkLike>();
  // The SDK object behind each permit handed out, so registerPermit gets back exactly what was prepared.
  private readonly prepared = new WeakMap<PreparedPermit["typedData"], SdkPreparedPermit>();
  // The SDK reports whether a permit exists, not until when: expiries are recorded at registration.
  private readonly expiries = new Map<string, number>();
  private readonly createSdk: (account: Hex) => ZamaSdkLike;
  private readonly oracleUrl: string;
  private readonly chainId: number;

  constructor(options: ZamaConfidentialClientOptions) {
    const chain = {
      ...(options.chain ?? sepolia),
      network: options.rpcUrl,
      relayerUrl: options.relayerUrl,
    };
    const storage = options.storage ?? new MemoryStorage();
    this.oracleUrl = options.oracleUrl;
    this.chainId = chain.id;
    this.createSdk =
      options.createSdk ??
      (account =>
        new ZamaSDK(
          createConfig({
            chains: [chain],
            relayers: { [chain.id]: web() },
            provider: new EthersProvider({ ethereum: jsonRpcProvider(options.rpcUrl) as never }),
            signer: new AccountOnlySigner({ address: account, chainId: chain.id }),
            storage,
          }),
        ));
  }

  // One SDK per account: switching the SDK's account drops the previous account's permits.
  private sdkFor(account: string): ZamaSdkLike {
    let sdk = this.sdks.get(key(account));
    if (!sdk) {
      sdk = this.createSdk(account as Hex);
      this.sdks.set(key(account), sdk);
    }
    return sdk;
  }

  async getPermitStatus(account: string, contracts: string[]): Promise<PermitStatus[]> {
    const sdk = this.sdkFor(account);
    const now = Math.floor(Date.now() / 1000);
    const statuses: PermitStatus[] = [];
    for (const contract of contracts) {
      const expiresAt = this.expiries.get(`${key(account)}:${key(contract)}`);
      if (expiresAt === undefined || expiresAt <= now) continue;
      if (await sdk.permits.hasPermit([contract as Hex])) statuses.push({ contract, expiresAt });
    }
    return statuses;
  }

  async preparePermit(account: string, contracts: string[]): Promise<PreparedPermit> {
    try {
      const prepared = await this.sdkFor(account).offline.preparePermit({
        signer: account as Hex,
        contracts: contracts as Hex[],
      });
      const { startTimestamp, durationDays } = prepared.eip712.message;
      const typedData = prepared.eip712 as PreparedPermit["typedData"];
      this.prepared.set(typedData, prepared);
      return {
        typedData,
        signerAddress: prepared.signerAddress,
        contracts,
        expiresAt: Number(startTimestamp) + Number(durationDays) * SECONDS_PER_DAY,
      };
    } catch (error) {
      throw toConfidentialError(error);
    }
  }

  async registerPermit(prepared: PreparedPermit, signature: Hex): Promise<void> {
    const sdkPrepared = this.prepared.get(prepared.typedData);
    if (!sdkPrepared)
      throw new ConfidentialError("PermitRequired", "permit was not prepared by this client");
    try {
      await this.sdkFor(prepared.signerAddress).permits.registerPermit(sdkPrepared, signature);
    } catch (error) {
      throw toConfidentialError(error);
    }
    for (const contract of prepared.contracts) {
      this.expiries.set(`${key(prepared.signerAddress)}:${key(contract)}`, prepared.expiresAt);
    }
  }

  async decrypt(
    account: string,
    items: { handle: Handle; contract: string }[],
  ): Promise<Record<Handle, bigint | ConfidentialError>> {
    const results: Record<Handle, bigint | ConfidentialError> = {};
    let values: Record<string, unknown> = {};
    try {
      values = await this.sdkFor(account).decryption.decryptValues(
        items.map(({ handle, contract }) => ({
          encryptedValue: handle,
          contractAddress: contract as Hex,
        })),
      );
    } catch (error) {
      // The SDK fails the whole batch: every handle carries the same typed error.
      for (const { handle, contract } of items)
        results[handle] = toConfidentialError(error, { contract, handle });
      return results;
    }
    const byHandle = new Map(Object.entries(values).map(([handle, value]) => [key(handle), value]));
    for (const { handle, contract } of items) {
      const value = byHandle.get(key(handle));
      results[handle] =
        typeof value === "bigint"
          ? value
          : new ConfidentialError("Unknown", "no decrypted value for this handle", {
              contract,
              handle,
            });
    }
    return results;
  }

  // Registry reads involve no account: they go through an SDK bound to none.
  async getConfidentialToken(
    underlying: string,
  ): Promise<{ wrapper: string; isValid: boolean } | null> {
    try {
      const token = await this.sdkFor(NO_ACCOUNT).registry.getConfidentialToken(underlying as Hex);
      return token && { wrapper: token.confidentialTokenAddress, isValid: token.isValid };
    } catch (error) {
      throw toConfidentialError(error, { contract: underlying });
    }
  }

  async publicDecrypt(): Promise<{ clearValues: Record<Handle, bigint>; decryptionProof: Hex }> {
    throw new ConfidentialError("Unavailable", "public decryption is not wired yet");
  }

  // The service encrypts the amount for `from`, builds the unsigned transaction and keeps the signed map entry
  // the device needs to show the amount.
  async prepareTransfer(p: {
    from: string;
    wrapper: string;
    to: string;
    amount: bigint;
  }): Promise<OraclePrepared> {
    let response: Response;
    try {
      response = await fetch(`${this.oracleUrl}/prepare/transfer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chainId: this.chainId,
          from: p.from,
          token: p.wrapper,
          to: p.to,
          amount: p.amount.toString(),
        }),
      });
    } catch (error) {
      throw new ConfidentialError("OracleUnavailable", undefined, {
        contract: p.wrapper,
        cause: error,
      });
    }
    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok || !isOracleTransaction(body)) {
      const error = (body as { error?: { code?: string; message?: string } } | undefined)?.error;
      const code = error?.code ? (ORACLE_ERRORS[error.code] ?? "Unknown") : "OracleUnavailable";
      throw new ConfidentialError(code, error?.message ?? `oracle answered ${response.status}`, {
        contract: p.wrapper,
      });
    }
    return { transaction: body.unsignedTx, handle: key(body.handle) as Handle };
  }

  async prepareUnwrap(): Promise<OraclePrepared> {
    throw new ConfidentialError("Unavailable", "unwrap is not wired yet");
  }

  async prepareFinalizeUnwrap(): Promise<OraclePrepared & { cleartext: bigint }> {
    throw new ConfidentialError("Unavailable", "finalize unwrap is not wired yet");
  }
}
