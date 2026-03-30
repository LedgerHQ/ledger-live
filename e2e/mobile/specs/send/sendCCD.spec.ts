import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { log } from "detox";
import { navigateToSendScreen, verifySendAndOperationDetails } from "./send";

const WALLET_PROXY_URL = "https://ccd-wallet-proxy-testnet.coin.ledger-test.com";

// Resolve on-chain address from public key via wallet-proxy API.
// Concordium addresses are NOT derived from BIP32 paths — they come from on-chain credential deployment.
async function resolveAddressFromPublicKey(publicKey: string): Promise<string> {
  const res = await fetch(`${WALLET_PROXY_URL}/v0/keyAccounts/${publicKey}`);
  if (!res.ok) {
    throw new Error(
      `[CCD] Wallet-proxy error ${res.status} ${res.statusText} for public key ${publicKey.slice(0, 16)}...`,
    );
  }
  const accounts = await res.json();
  if (!accounts?.length) {
    throw new Error(`No on-chain accounts found for public key ${publicKey}`);
  }
  log.info(
    `[CCD] Resolved address ${accounts[0].address} from public key ${publicKey.slice(0, 16)}...`,
  );
  return accounts[0].address;
}

const transaction = new Transaction(Account.CCD_TESTNET_1, Account.CCD_TESTNET_2, "50", undefined);

$Tag("@NanoSP", "@concordium", "@family-concordium");
describe("Send from 1 account to another", () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: transaction.accountToDebit.currency.speculosApp,
      userdata: "concordium-account",
      featureFlags: {
        llmAccountListUI: { enabled: true },
        currencyConcordiumTestnet: { enabled: true },
      },
      cliCommands: [
        async () => {
          // Get public keys from speculos and resolve on-chain addresses via wallet-proxy.
          // This mirrors how other coins use CLI.getAddress but adds the Concordium-specific
          // wallet-proxy lookup (addresses are SHA256(credId), not derived from BIP32 paths).
          const debitInfo = await CLI.getAddress({
            currency: transaction.accountToDebit.currency.speculosApp.name,
            path: transaction.accountToDebit.accountPath,
          });
          transaction.accountToDebit.address = await resolveAddressFromPublicKey(
            debitInfo.publicKey,
          );

          const creditInfo = await CLI.getAddress({
            currency: transaction.accountToCredit.currency.speculosApp.name,
            path: transaction.accountToCredit.accountPath,
          });
          transaction.accountToCredit.address = await resolveAddressFromPublicKey(
            creditInfo.publicKey,
          );
          transaction.recipientAddress = transaction.accountToCredit.address;
        },
      ],
    });

    await app.portfolio.waitForPortfolioPageToLoad();

    // Add account through UI so the Speculos-derived key is used for discovery.
    // CLI.liveData doesn't support concordium_testnet yet.
    await app.portfolio.addAccount();
    await app.addAccount.importWithYourLedger();

    const currency = transaction.accountToDebit.currency;
    const isModularDrawer = await app.modularDrawer.isFlowEnabled("add_account");
    if (isModularDrawer) {
      await app.modularDrawer.performSearchByTicker(currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(currency.ticker);
      await app.modularDrawer.selectNetworkIfAsked(currency.name);
    } else {
      await app.common.performSearch(currency.id);
      await app.receive.selectCurrency(currency.id);
      await app.receive.selectNetworkIfAsked(currency.id);
    }

    await app.addAccount.waitAccountsDiscovery();
    await app.addAccount.finishAccountsDiscovery();
    await app.addAccount.tapCloseAddAccountCta();
  });

  it(`Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName}`, async () => {
    const addressToCredit = transaction.accountToCredit.address;
    await navigateToSendScreen(transaction.accountToDebit.accountName);
    await app.send.setRecipientAndContinue(addressToCredit, transaction.memoTag);
    await app.send.setAmountAndContinue(transaction.amount);

    const amountWithCode =
      transaction.amount + "\u00a0" + transaction.accountToCredit.currency.ticker;
    await verifySendAndOperationDetails(transaction, amountWithCode);
  });
});
