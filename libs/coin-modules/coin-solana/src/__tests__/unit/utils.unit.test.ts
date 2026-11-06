import {
  clusterApiUrl,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getEnv } from "@ledgerhq/live-env";
import type { SolanaCoinConfig } from "../../config";
import {
  DUMMY_SIGNATURE,
  endpointByCurrencyId,
  LEDGER_VALIDATOR_BY_FIGMENT,
  LEDGER_VALIDATOR_BY_BITWISE,
  LEDGER_VALIDATOR_DEFAULT,
  refreshesBlockhash,
} from "../../utils";

jest.mock("@ledgerhq/live-env", () => ({ getEnv: jest.fn() }));

const mockGetEnv = getEnv as jest.Mock;

const configWithRpcUrls = (rpcUrls?: SolanaCoinConfig["rpcUrls"]): SolanaCoinConfig =>
  ({ token2022Enabled: false, legacyOCMSMaxVersion: "1.0.0", rpcUrls }) as SolanaCoinConfig;

describe("utils - refreshesBlockhash", () => {
  const SENDER = new PublicKey("HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM");
  const OTHER = new PublicKey("AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ");
  const BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

  const transfer = (payer: PublicKey, from: PublicKey) =>
    new VersionedTransaction(
      new TransactionMessage({
        payerKey: payer,
        recentBlockhash: BLOCKHASH,
        instructions: [SystemProgram.transfer({ fromPubkey: from, toPubkey: OTHER, lamports: 1 })],
      }).compileToV0Message(),
    );

  it("refreshes a transaction the sender alone signs, while it is unsigned", () => {
    expect(refreshesBlockhash(transfer(SENDER, SENDER))).toBe(true);
  });

  it("keeps the blockhash of a transaction already signed", () => {
    const signed = transfer(SENDER, SENDER);
    signed.signatures[0] = Buffer.alloc(64, 7);
    expect(refreshesBlockhash(signed)).toBe(false);
  });

  it("keeps the blockhash while a co-signer still has to sign", () => {
    // The sender pays and a second account signs, or a partner pays and the sender signs second.
    expect(refreshesBlockhash(transfer(SENDER, OTHER))).toBe(false);
    expect(refreshesBlockhash(transfer(OTHER, SENDER))).toBe(false);
  });

  it("treats the 0x01-filled placeholder as unsigned", () => {
    const placeholder = transfer(SENDER, SENDER);
    placeholder.signatures[0] = DUMMY_SIGNATURE;
    expect(refreshesBlockhash(placeholder)).toBe(true);
  });
});

describe("utils - endpointByCurrencyId", () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue("https://proxy.solana.example.com");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when coin config has no rpcUrls", () => {
    const config = configWithRpcUrls(undefined);

    it("falls back to API_SOLANA_PROXY for solana", () => {
      expect(endpointByCurrencyId(config, "solana")).toBe("https://proxy.solana.example.com");
    });

    it("falls back to clusterApiUrl for solana_devnet", () => {
      expect(endpointByCurrencyId(config, "solana_devnet")).toBe(clusterApiUrl("devnet"));
    });

    it("falls back to clusterApiUrl for solana_testnet", () => {
      expect(endpointByCurrencyId(config, "solana_testnet")).toBe(clusterApiUrl("testnet"));
    });
  });

  describe("when coin config provides rpcUrls", () => {
    const config = configWithRpcUrls({
      solana: "https://custom-mainnet.example.com",
      solana_devnet: "https://custom-devnet.example.com",
      solana_testnet: "https://custom-testnet.example.com",
    });

    it("uses the configured mainnet URL", () => {
      expect(endpointByCurrencyId(config, "solana")).toBe("https://custom-mainnet.example.com");
    });

    it("uses the configured devnet URL", () => {
      expect(endpointByCurrencyId(config, "solana_devnet")).toBe(
        "https://custom-devnet.example.com",
      );
    });

    it("uses the configured testnet URL", () => {
      expect(endpointByCurrencyId(config, "solana_testnet")).toBe(
        "https://custom-testnet.example.com",
      );
    });
  });

  it("throws for unknown currency ids", () => {
    expect(() => endpointByCurrencyId(configWithRpcUrls(undefined), "solana_unknown")).toThrow(
      /unexpected currency id format/,
    );
  });
});

describe("utils - Default Validators", () => {
  it("should have APY property", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT).toMatchObject({ apy: expect.any(Number) });
    expect(LEDGER_VALIDATOR_BY_BITWISE).toMatchObject({ apy: expect.any(Number) });
  });
  it("should have different APY values", () => {
    expect(LEDGER_VALIDATOR_BY_FIGMENT.apy).not.toBe(LEDGER_VALIDATOR_BY_BITWISE.apy);
  });

  it("should reference correct default", () => {
    expect(LEDGER_VALIDATOR_DEFAULT).toBe(LEDGER_VALIDATOR_BY_FIGMENT);
  });
});
