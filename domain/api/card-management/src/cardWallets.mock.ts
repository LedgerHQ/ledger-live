import type {
  PayCardInternalWallet,
  PayCardLinkedWalletResponse,
  PayCardRewardWallet,
} from "./types";

/**
 * The wallets both answers describe, every one of them linked to the card.
 *
 * Three rather than one, on three chains: the balance screen joins the two answers and prices each
 * row on its own, so a single wallet left the sum, the ordering and an unpriced row untested. Each
 * pair is one the asset catalog covers, so a mocked row resolves to a currency like a real one.
 *
 * `addressId` is deliberately not the wallet's `id`: the link is made by `addressId`, and the two
 * differ.
 */
const MOCK_WALLETS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    addressId: "0x2222222222222222222222222222222222222222",
    currency: "usdc",
    network: "ethereum",
    address: "0x0000000000000000000000000000000000000000",
    balance: "125.40",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    addressId: "0e6a1b7c-9d3f-4a52-8c14-5b7e9f0a2d68",
    currency: "btc",
    network: "bitcoin",
    address: "bc1qmockwalletaddressmockwalletaddressmock0",
    balance: "0.00432100",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    addressId: "7f2c4e81-6ab9-4d03-95e7-1c8d3f5b0a47",
    currency: "sol",
    network: "solana",
    address: "SoLMockWa11etAddre55MockWa11etAddre55Moc",
    balance: "12.500000000",
  },
] as const;

const MOCK_REWARD_WALLET_ID = "44444444-4444-4444-8444-444444444444";

/** The join keys balances to linked wallets by id, so both answers describe the same wallets. */
export function mockPayCardInternalWallets(funded: boolean): readonly PayCardInternalWallet[] {
  return MOCK_WALLETS.map(({ id, addressId, currency, address, balance }) => ({
    id,
    // Emptied rather than dropped: an unfunded card still has its wallets, they just hold nothing.
    balance: funded ? balance : "0.00",
    currency,
    address,
    addressMemo: null,
    addressId,
  }));
}

/** Every mocked wallet is linked, in the order they were listed, so the join finds all of them. */
export function mockPayCardLinkedWallets(): readonly PayCardLinkedWalletResponse[] {
  return MOCK_WALLETS.map(({ id, address, currency, network }, index) => ({
    id,
    address,
    currency,
    network,
    priority: index,
  }));
}

export function mockPayCardRewardWallet(): PayCardRewardWallet {
  return {
    id: MOCK_REWARD_WALLET_ID,
    balance: "10.32",
    currency: "usdc",
    isWithdrawable: true,
  };
}
