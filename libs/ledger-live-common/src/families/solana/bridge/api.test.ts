/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, CryptoAssetsStore, StakingDelegation } from "@ledgerhq/types-live";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { log } from "@ledgerhq/logs";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import solanaBridge, {
  applyDeviceSignResult,
  buildIntentData,
  computeIntentType,
  getDeviceSignOptions,
  describeOptimisticOperation,
  getAssetFromToken,
  getHeldNativeAmount,
  getTokenFromAsset,
} from "./api";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore");
jest.mock("@ledgerhq/logs");

const mockGetTokenAccountShapes = jest.fn();
jest.mock("@ledgerhq/coin-solana/logic/tokenAccountShapes", () => ({
  getTokenAccountShapes: (...args: unknown[]) => mockGetTokenAccountShapes(...args),
}));
const mockGetLatestBlockhash = jest.fn();
jest.mock("@ledgerhq/coin-solana/network/index", () => ({
  getChainAPI: () => ({ getLatestBlockhash: mockGetLatestBlockhash }),
}));
jest.mock("../../../config", () => ({ getCurrencyConfiguration: () => ({}) }));
jest.mock("@ledgerhq/coin-solana/utils", () => ({
  ...jest.requireActual("@ledgerhq/coin-solana/utils"),
  endpointByCurrencyId: () => "endpoint",
}));

const mockToken = {
  id: "solana/spl/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  tokenType: "spl",
  contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  name: "USD Coin",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as unknown as TokenCurrency;

const solana = getCryptoCurrencyById("solana");

describe("solana bridge", () => {
  describe("staking", () => {
    it("declares staking support explicitly", () => {
      expect(solanaBridge(solana).stakingSupported).toBe(true);
    });
  });

  describe("native balance", () => {
    it("sums the native entries, which partition the account balance", () => {
      expect(solanaBridge(solana).partitionsNativeBalance).toBe(true);
    });

    it("exposes the lamports a stake account holds", () => {
      expect(solanaBridge(solana).getHeldNativeAmount).toBe(getHeldNativeAmount);
    });

    it("adds the active, inactive and reserve lamports of a stake account", () => {
      expect(
        getHeldNativeAmount({
          amount: new BigNumber(1),
          activeAmount: new BigNumber(300),
          inactiveAmount: new BigNumber(700),
          lockedReserve: new BigNumber(20),
        } as StakingDelegation),
      ).toEqual(new BigNumber(1_020));
    });

    it("falls back to the amount and the reserve without active and inactive lamports", () => {
      expect(
        getHeldNativeAmount({
          amount: new BigNumber(500),
          lockedReserve: new BigNumber(20),
        } as StakingDelegation),
      ).toEqual(new BigNumber(520));
    });
  });

  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "stake" }, "stake.createAccount"],
      [{ mode: "delegate" }, "stake.delegate"],
      [{ mode: "undelegate" }, "stake.undelegate"],
      [{ mode: "unstake" }, "stake.withdraw"],
      [{ mode: "opt-in" }, "token.createATA"],
      [{ mode: "approve" }, "token.approve"],
      [{ mode: "revoke" }, "token.revoke"],
      [{ mode: "split" }, "stake.split"],
    ])("should map %o to %s", (transaction, expected) => {
      expect(computeIntentType(transaction)).toBe(expected);
    });

    it("should throw for an unsupported mode", () => {
      expect(() => computeIntentType({ mode: "swap" })).toThrow(
        "Unsupported Solana transaction mode: swap",
      );
    });
  });

  describe("getTokenFromAsset", () => {
    const mockFindTokenByAddressInCurrency = jest.fn() as jest.MockedFunction<
      CryptoAssetsStore["findTokenByAddressInCurrency"]
    >;

    (
      jest.requireMock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore") as {
        getCryptoAssetsStore: jest.Mock;
      }
    ).getCryptoAssetsStore.mockReturnValue({
      findTokenByAddressInCurrency: mockFindTokenByAddressInCurrency,
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return undefined when asset type is native", async () => {
      const asset: AssetInfo = { type: "native" };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should return undefined when asset has no assetReference", async () => {
      const asset = { type: "spl" } as AssetInfo;

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
      expect(mockFindTokenByAddressInCurrency).not.toHaveBeenCalled();
    });

    it("should call findTokenByAddressInCurrency with correct arguments", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      };

      await getTokenFromAsset(solana, asset);

      expect(mockFindTokenByAddressInCurrency).toHaveBeenCalledWith(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        solana.id,
      );
    });

    it("should return the token when found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(mockToken);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBe(mockToken);
    });

    it("should return undefined when token is not found", async () => {
      mockFindTokenByAddressInCurrency.mockResolvedValue(undefined);
      const asset: AssetInfo = {
        type: "spl",
        assetReference: "UnknownMintAddress1111111111111111111111111",
      };

      const result = await getTokenFromAsset(solana, asset);

      expect(result).toBeUndefined();
    });
  });

  describe("getAssetFromToken", () => {
    const owner = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

    it("should return correct AssetInfo with all fields mapped properly", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toEqual({
        type: "spl",
        assetReference: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        assetOwner: owner,
      });
    });

    it("should use token.tokenType for type", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result.type).toBe(mockToken.tokenType);
    });

    it("should use token.contractAddress for assetReference", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toHaveProperty("assetReference", mockToken.contractAddress);
    });

    it("should pass owner as assetOwner", () => {
      const result = getAssetFromToken(mockToken, owner);

      expect(result).toHaveProperty("assetOwner", owner);
    });
  });

  describe("describeOptimisticOperation", () => {
    const account = {} as Parameters<typeof describeOptimisticOperation>[1];
    const fees = new BigNumber(5000);

    it.each([
      ["delegate", "DELEGATE"],
      ["undelegate", "UNDELEGATE"],
      ["unstake", "WITHDRAW_UNBONDED"],
      ["split", "FEES"],
      ["approve", "FEES"],
      ["revoke", "FEES"],
    ])("types a %s as %s and moves no principal", (mode, expected) => {
      expect(describeOptimisticOperation(mode, account, { fees })).toEqual({
        type: expected,
        value: new BigNumber(0),
      });
    });

    it("locks the delegated amount and the stake account rent when opening a stake", () => {
      expect(
        describeOptimisticOperation("stake", account, {
          fees,
          amount: new BigNumber(1_000_000_000),
          stakeAccountRent: new BigNumber(2_282_880),
        }),
      ).toEqual({ type: "DELEGATE", value: new BigNumber(1_002_282_880) });
    });

    it("leaves the rent inside the amount when opening a stake with send-max", () => {
      expect(
        describeOptimisticOperation("stake", account, {
          fees,
          useAllAmount: true,
          amount: new BigNumber(1_000_000_000),
          stakeAccountRent: new BigNumber(2_282_880),
        }),
      ).toEqual({ type: "DELEGATE", value: new BigNumber(1_000_000_000) });
    });

    it("types an opt-in as OPT_IN, its rent already carried by the fee", () => {
      expect(describeOptimisticOperation("opt-in", account, { fees })).toEqual({
        type: "OPT_IN",
        value: new BigNumber(0),
      });
    });

    it("leaves a plain send to the generic mapping", () => {
      expect(describeOptimisticOperation("send", account, { fees })).toBeUndefined();
    });

    it("falls back to a zero value when the amount is not loaded", () => {
      expect(describeOptimisticOperation("stake", account, {})?.value).toEqual(new BigNumber(0));
    });
  });

  describe("getDeviceSignOptions", () => {
    const withToken = {
      currency: solana,
      subAccounts: [{ id: "sub-1", token: mockToken }],
    } as unknown as Parameters<typeof getDeviceSignOptions>[1];

    it("names the recipient token account so the device can resolve its owner", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: "sub-1",
            recipientTokenAccount: "recipient-ata",
            userInputType: "sol",
          },
          withToken,
        ),
      ).toMatchObject({
        tokenInternalId: mockToken.id,
        tokenAddress: "recipient-ata",
        userInputType: "sol",
      });
    });

    it("opens the recipient account instead of naming one that does not exist yet", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: "sub-1",
            recipientWalletAddress: "recipient-wallet",
            assetReference: mockToken.contractAddress,
            userInputType: "sol",
          },
          withToken,
        ),
      ).toMatchObject({
        tokenInternalId: mockToken.id,
        createATA: { address: "recipient-wallet", mintAddress: mockToken.contractAddress },
        userInputType: "sol",
      });
    });

    it("names the owner when the transaction opens their own account", () => {
      expect(
        getDeviceSignOptions(
          {
            mode: "opt-in",
            subAccountId: "sub-1",
            assetReference: mockToken.contractAddress,
          },
          { ...withToken, freshAddress: "owner-addr" } as typeof withToken,
        ),
      ).toMatchObject({
        createATA: { address: "owner-addr", mintAddress: mockToken.contractAddress },
      });
    });

    it("still names the token when the wallet API signs against a placeholder sub-account", () => {
      expect(
        getDeviceSignOptions(
          {
            subAccountId: `${"parent"}+${mockToken.contractAddress}`,
            recipientTokenAccount: "recipient-ata",
            assetReference: mockToken.contractAddress,
            userInputType: "sol",
          },
          withToken,
        ),
      ).toMatchObject({
        tokenInternalId: mockToken.id,
        tokenAddress: "recipient-ata",
        userInputType: "sol",
      });
    });

    it("names a token the account does not hold yet from the placeholder's encoded id", () => {
      const withoutToken = { currency: solana, subAccounts: [] } as unknown as Account;

      expect(
        getDeviceSignOptions(
          {
            subAccountId: encodeTokenAccountId("parent", mockToken),
            assetReference: mockToken.contractAddress,
            recipientTokenAccount: "recipient-ata",
          },
          withoutToken,
        ),
      ).toMatchObject({ tokenInternalId: mockToken.id, tokenAddress: "recipient-ata" });
    });

    it("does not mistake the token account address of a legacy id for a token id", () => {
      const withoutToken = { currency: solana, subAccounts: [] } as unknown as Account;

      expect(
        getDeviceSignOptions({ subAccountId: "parent+ataAddress" }, withoutToken),
      ).not.toHaveProperty("tokenInternalId");
    });

    it("carries the template id of a partner-built transaction", () => {
      expect(getDeviceSignOptions({ templateId: "tpl-1" }, withToken)).toMatchObject({
        templateId: "tpl-1",
      });
    });

    describe("delayed signing", () => {
      const payer = PublicKey.unique();
      const [crafted, refreshed] = [PublicKey.unique().toBase58(), PublicKey.unique().toBase58()];
      const transactionWith = (blockhash: string, signature?: Buffer) => {
        const transaction = new VersionedTransaction(
          new TransactionMessage({
            payerKey: payer,
            recentBlockhash: blockhash,
            instructions: [
              SystemProgram.transfer({ fromPubkey: payer, toPubkey: payer, lamports: 1 }),
            ],
          }).compileToLegacyMessage(),
        );
        if (signature) transaction.signatures = [signature];
        return transaction;
      };
      const base64Of = (transaction: VersionedTransaction) =>
        Buffer.from(transaction.serialize()).toString("base64");
      const blockhashOf = (base64: string) =>
        VersionedTransaction.deserialize(Buffer.from(base64, "base64")).message.recentBlockhash;

      beforeEach(() => mockGetLatestBlockhash.mockResolvedValue({ blockhash: refreshed }));

      it("takes a fresh blockhash after the review and signs with it", async () => {
        const unsigned = base64Of(transactionWith(crafted));
        const options = getDeviceSignOptions({ recipient: "addr" }, withToken);

        expect(options).toMatchObject({ delayed: true, solanaRPCURL: "endpoint" });
        expect(applyDeviceSignResult(unsigned, options)).toBe(unsigned);

        const fetchBlockhash = options?.fetchBlockhash;
        if (typeof fetchBlockhash !== "function") throw new Error("fetchBlockhash is missing");
        const fetched = await fetchBlockhash();

        expect(fetched).toEqual(bs58.decode(refreshed));
        expect(mockGetLatestBlockhash).toHaveBeenCalledWith("confirmed");
        expect(blockhashOf(applyDeviceSignResult(unsigned, options))).toBe(refreshed);
      });

      it("keeps a co-signed raw transaction as it is, its message being final", () => {
        const raw = base64Of(transactionWith(crafted, Buffer.alloc(64, 7)));

        expect(getDeviceSignOptions({ raw }, withToken)).not.toHaveProperty("delayed");
      });
    });
  });

  describe("buildIntentData", () => {
    it("carries a partner-built transaction so the bytes reach the coin module", () => {
      expect(buildIntentData({ raw: "AQID", templateId: "tpl-1" })).toEqual({
        type: "buffer",
        value: Buffer.from("AQID", "base64"),
      });
    });

    it("carries the stake account seed when there is no partner payload", () => {
      expect(buildIntentData({ familySpecificData: { stakeAccountSeed: "seed-1" } })).toEqual({
        type: "stakeAccountSeed",
        value: "seed-1",
      });
    });

    it("leaves every other transaction to the coin module", () => {
      expect(buildIntentData({ mode: "send", recipient: "addr" })).toEqual({ type: "none" });
    });
  });

  describe("buildTokenAccountShapes", () => {
    it("reads the token account shapes off the chain", async () => {
      mockGetTokenAccountShapes.mockResolvedValue({ mint: { state: "frozen" } });

      expect(await solanaBridge(solana).buildTokenAccountShapes?.("owner")).toEqual({
        mint: { state: "frozen" },
      });
    });

    it("reports no shape rather than failing the sync when the chain is unreachable", async () => {
      mockGetTokenAccountShapes.mockRejectedValue(new Error("network"));

      expect(await solanaBridge(solana).buildTokenAccountShapes?.("owner")).toEqual({});
      expect(log).toHaveBeenCalledWith("solana", "token account shapes unavailable", {
        error: "Error: network",
      });
    });
  });
});
