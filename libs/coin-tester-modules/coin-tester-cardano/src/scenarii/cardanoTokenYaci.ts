import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Scenario } from "@ledgerhq/coin-tester/main";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CARDANO_TESTNET, FRESH_ADDRESS_PATH, makeAccount } from "../fixtures";
import { getBridges, TESTNET } from "../helpers";
import { computePolicyId, mintToken } from "../mintToken";
import { buildSigner } from "../signer";
import { killYaci, pollUtxos, spawnYaci, topup } from "../yaci";
import { initYaciIndexer, registerAddress, resetRegisteredAddresses } from "../yaciIndexer";

const FUNDING_ADA = 10_000;
const ASSET_NAME_HEX = "4d59544f4b454e";
const MINT_AMOUNT = 1_000n;
const SEND_TOKENS = new BigNumber(400);
const RECIPIENT_PATH = "1852'/1815'/1'/0/0";

let closeIndexer: (() => void) | undefined;
let tokenSubAccountId = "";
let recipient = "";
let assetRef = "";
let owner = "";

function tokenSubAccount(account: Account): TokenAccount | undefined {
  return account.subAccounts?.find(sa => sa.id === tokenSubAccountId) as TokenAccount | undefined;
}

// Native-token send against a real Yaci devnet: mint a test asset (the faucet is ADA-only), then send
// it via the CoinModule craft (single payment witness = a send). Testnet; staking stays on the mock.
export const scenarioCardanoTokenYaci: Scenario<GenericTransaction, Account> = {
  name: "Cardano native token send (Yaci devnet)",

  setup: async () => {
    LiveConfig.setConfig({
      config_currency_cardano_testnet: {
        type: "object",
        default: { status: { type: "active" }, maxFeesWarning: 0, maxFeesError: 0 },
      },
    });

    await spawnYaci();
    closeIndexer = initYaciIndexer();

    const signer = await buildSigner();
    const { accountBridge, currencyBridge, getAddress } = await getBridges(signer, TESTNET);
    const { address } = await getAddress("", {
      path: FRESH_ADDRESS_PATH,
      currency: CARDANO_TESTNET,
      derivationMode: "",
    });
    recipient = (await signer.getAddress(RECIPIENT_PATH, TESTNET.networkId)).address;
    registerAddress(address, TESTNET.networkId);

    // The asset reference is the concatenated policyId+assetName (no separator) — the form
    // getBalance emits and craftTransaction's parseTokenAssetReference expects.
    const policyId = computePolicyId(address);
    const assetReference = `${policyId}${ASSET_NAME_HEX}`;
    assetRef = assetReference;
    owner = address;
    const token: TokenCurrency = {
      type: "TokenCurrency",
      id: `cardano_testnet/native/${assetReference}`,
      contractAddress: assetReference,
      parentCurrencyId: CARDANO_TESTNET.id,
      tokenType: "native",
      name: "Coin Tester Token",
      ticker: "CTT",
      units: [{ name: "Coin Tester Token", code: "CTT", magnitude: 0 }],
    };
    setupMockCryptoAssetsStore({
      // Match by asset reference only — buildSubAccounts queries with the bridge's currency.id, which
      // can be the parent "cardano" rather than "cardano_testnet"; the single test token is unambiguous.
      findTokenByAddressInCurrency: async addr => (addr === assetReference ? token : undefined),
      findTokenById: async id => (id === token.id ? token : undefined),
    });

    await topup(address, FUNDING_ADA);
    await pollUtxos(address, u =>
      u.some(x => x.amount.length === 1 && x.amount[0].unit === "lovelace"),
    );
    await mintToken({
      address,
      derivationPath: FRESH_ADDRESS_PATH,
      signer,
      networkId: TESTNET.networkId,
      currencyId: "cardano_testnet",
      assetNameHex: ASSET_NAME_HEX,
      amount: MINT_AMOUNT,
    });
    await pollUtxos(address, u => u.some(x => x.amount.some(a => a.unit === assetReference)));

    const account = makeAccount(address, CARDANO_TESTNET);
    tokenSubAccountId = encodeTokenAccountId(account.id, token);

    return { accountBridge, currencyBridge, account, retryLimit: 20, retryInterval: 2_000 };
  },

  beforeAll: account => {
    const sub = tokenSubAccount(account);
    expect(sub).toBeDefined();
    expect(sub!.balance.toString()).toBe(MINT_AMOUNT.toString());
  },

  getTransactions: () => [
    {
      name: "Send 400 CTT (native token)",
      amount: SEND_TOKENS,
      recipient,
      subAccountId: tokenSubAccountId,
      // Identify the token asset explicitly (the framework accepts assetReference+assetOwner as well
      // as subAccountId) so transactionToIntent builds a token intent → craft's token branch.
      assetReference: assetRef,
      assetOwner: owner,
      nonce: new BigNumber(0), // UTXO has no sequence — skip the generic flow's getNextSequence (see docs).
      expect: (previousAccount, currentAccount) => {
        const prevSub = tokenSubAccount(previousAccount);
        const sub = tokenSubAccount(currentAccount);
        expect(sub).toBeDefined();
        const [latest] = sub!.operations;
        expect(latest.type).toBe("OUT");
        expect(latest.value.toString()).toBe(SEND_TOKENS.toString());
        expect(sub!.balance.toString()).toBe(prevSub!.balance.minus(SEND_TOKENS).toString());
        expect(currentAccount.balance.lt(previousAccount.balance)).toBe(true); // fee + recipient min-ADA
      },
    },
    {
      // ADA send-all while holding a token: craft keeps the held tokens on the sender (in a min-ADA
      // UTXO) and sweeps only the remaining ADA to the recipient — a Cardano-specific behavior a real
      // node enforces. No subAccountId → this is a native-ADA sweep, not a token transfer.
      name: "Send Max ADA (tokens preserved)",
      useAllAmount: true,
      recipient,
      nonce: new BigNumber(0),
      expect: (previousAccount, currentAccount) => {
        const [latest] = currentAccount.operations;
        expect(latest.type).toBe("OUT");
        // The token is NOT swept: the sub-account survives with its balance unchanged.
        const prevSub = tokenSubAccount(previousAccount);
        const sub = tokenSubAccount(currentAccount);
        expect(sub).toBeDefined();
        expect(sub!.balance.toString()).toBe(prevSub!.balance.toString());
      },
    },
  ],

  teardown: async () => {
    closeIndexer?.();
    resetRegisteredAddresses();
    await killYaci();
  },
};
