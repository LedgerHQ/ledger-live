import { create } from "superstruct";
import { PARSED_PROGRAMS } from "./program/constants";
import { PublicKeyFromString } from "./validators/pubkey";
import { getMaybeTokenAccount, getTransactions } from "./web3";
import { getChainAPI } from ".";

const api = getChainAPI({
  endpoint: "https://solana.coin.ledger.com",
});

const usdcMintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC Mint address
const usdtMintAddress = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"; // USDT Mint address
const account1 = {
  solAccountAddress: "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE", // Circle account address
  tokenAccountAddress: "3emsAVdmGKERbHjmGfQ6oZ1e35dkf5iYcS6U4CPKFVaa", // Token account owning the supply for Circle
  ataAddress: "4kokFKCFMxpCpG41yLYkLEqXW8g1WPfCt2NC9KGivY6N", // Computed ATA address, which is not used to own USDC. Thus the account exists, it has a balance too weak.
};
const account2 = {
  solAccountAddress: "HYe4vSaEGqQKnDrxWDrk3o5H2gznv7qtij5G6NNG8WHd",
  ataAddress: "HMhsfjwxHcgvfKJatsbhPxhPFKWYPbPUd8FUAGQ79RJ2",
};

describe("getMaybeTokenAccount", () => {
  it.each([
    {
      address: account1.tokenAccountAddress,
      mint: usdcMintAddress,
      owner: account1.solAccountAddress,
    },
    {
      address: account2.ataAddress,
      mint: usdtMintAddress,
      owner: account2.solAccountAddress,
    },
  ])("returns account info", async ({ address, mint, owner }) => {
    const accountInfo = await getMaybeTokenAccount(address, api);

    expect(accountInfo).toEqual({
      isNative: false,
      mint: create(mint, PublicKeyFromString),
      owner: create(owner, PublicKeyFromString),
      state: "initialized",
      tokenAmount: expect.objectContaining({
        decimals: 6,
      }),
    });
  });

  it("returns account info", async () => {
    const address = account2.solAccountAddress;

    const accountInfo = await getMaybeTokenAccount(address, api);

    expect(accountInfo).toBeUndefined();
  });
});

describe("findTokenAccAddress", () => {
  it.each([
    {
      // address: account1.tokenAccountAddress, // Token Address --> real one onchain
      address: account1.ataAddress, // ATA Address --> doesn't exist onchain
      mint: usdcMintAddress,
      owner: account1.solAccountAddress,
    },
    {
      address: account2.ataAddress,
      mint: usdtMintAddress,
      owner: account2.solAccountAddress,
    },
  ])("returns the expected ATA address", async ({ address, mint, owner }) => {
    const ata = await api.findAssocTokenAccAddress(owner, mint, PARSED_PROGRAMS.SPL_TOKEN);

    expect(ata).toEqual(address);
  });
});

describe("getTransactions", () => {
  it.each([
    {
      address: "Cv9b7PuxVdKXTKTBXvZSQfSqbMNmPHP8brv77ZL2D95m",
      untilTxSignature: undefined,
    },
    {
      address: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
      untilTxSignature: undefined,
    },
  ])(
    "returns the expected transactions without any fail transactions",
    async ({ address, untilTxSignature }) => {
      const txs = await getTransactions(address, untilTxSignature, api);
      const hasError = txs.some(tx => tx.info.err);
      expect(hasError).toBe(false);
    },
  );
});
