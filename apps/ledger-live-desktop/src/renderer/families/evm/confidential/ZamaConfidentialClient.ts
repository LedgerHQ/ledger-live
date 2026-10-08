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
  decryption: Pick<ZamaSDK["decryption"], "decryptValues" | "decryptPublicValues">;
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

type OracleAnswer = { unsignedTx: string; handle?: unknown; cleartextAmount?: unknown };

function isOracleAnswer(value: unknown): value is OracleAnswer {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as OracleAnswer).unsignedTx === "string"
  );
}

const isHandle = (value: unknown): value is Handle =>
  typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);

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

  // Public decryption needs no permit: the relayer answers once the handle is publicly decryptable.
  async publicDecrypt(
    handles: Handle[],
  ): Promise<{ clearValues: Record<Handle, bigint>; decryptionProof: Hex }> {
    try {
      const result = await this.sdkFor(NO_ACCOUNT).decryption.decryptPublicValues(handles);
      const clearValues: Record<Handle, bigint> = {};
      for (const [handle, value] of Object.entries(result.clearValues)) {
        if (typeof value === "bigint") clearValues[key(handle) as Handle] = value;
      }
      return { clearValues, decryptionProof: result.decryptionProof };
    } catch (error) {
      throw toConfidentialError(error);
    }
  }

  // The service encrypts the amount for `from`, builds the unsigned transaction and keeps the signed map entry
  // the device needs to show the amount.
  async prepareTransfer(p: {
    from: string;
    wrapper: string;
    to: string;
    amount: bigint;
  }): Promise<OraclePrepared> {
    const answer = await this.oracle("/prepare/transfer", p.wrapper, {
      from: p.from,
      token: p.wrapper,
      to: p.to,
      amount: p.amount.toString(),
    });
    return this.attested(answer, p.wrapper);
  }

  // Phase 1 of an unshield: an unwrap of an explicit amount, attested like a transfer.
  async prepareUnwrap(p: {
    from: string;
    wrapper: string;
    to: string;
    amount: bigint;
  }): Promise<OraclePrepared> {
    const answer = await this.oracle("/prepare/unwrap", p.wrapper, {
      from: p.from,
      token: p.wrapper,
      to: p.to,
      amount: p.amount.toString(),
    });
    return this.attested(answer, p.wrapper);
  }

  // Phase 2: the service runs the public decryption and returns finalizeUnwrap with the cleartext and its proof.
  async prepareFinalizeUnwrap(p: {
    from: string;
    wrapper: string;
    unwrapRequestId: Handle;
  }): Promise<OraclePrepared & { cleartext: bigint }> {
    const answer = await this.oracle("/prepare/finalize-unwrap", p.wrapper, {
      from: p.from,
      wrapper: p.wrapper,
      unwrapRequestId: p.unwrapRequestId,
    });
    if (typeof answer.cleartextAmount !== "string" || !/^\d+$/.test(answer.cleartextAmount)) {
      throw new ConfidentialError("Unknown", "the service returned no cleartext amount", {
        contract: p.wrapper,
      });
    }
    return {
      transaction: answer.unsignedTx,
      handle: key(p.unwrapRequestId) as Handle,
      cleartext: BigInt(answer.cleartextAmount),
    };
  }

  private attested(answer: OracleAnswer, wrapper: string): OraclePrepared {
    if (!isHandle(answer.handle)) {
      throw new ConfidentialError("Unknown", "the service returned no handle", {
        contract: wrapper,
      });
    }
    return { transaction: answer.unsignedTx, handle: key(answer.handle) as Handle };
  }

  private async oracle(
    path: string,
    wrapper: string,
    body: Record<string, string>,
  ): Promise<OracleAnswer> {
    let response: Response;
    try {
      response = await fetch(`${this.oracleUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chainId: this.chainId, ...body }),
      });
    } catch (error) {
      throw new ConfidentialError("OracleUnavailable", undefined, {
        contract: wrapper,
        cause: error,
      });
    }
    const answer: unknown = await response.json().catch(() => undefined);
    if (!response.ok || !isOracleAnswer(answer)) {
      const error = (answer as { error?: { code?: string; message?: string } } | undefined)?.error;
      const code = error?.code ? (ORACLE_ERRORS[error.code] ?? "Unknown") : "OracleUnavailable";
      throw new ConfidentialError(code, error?.message ?? `oracle answered ${response.status}`, {
        contract: wrapper,
      });
    }
    return answer;
  }
}
