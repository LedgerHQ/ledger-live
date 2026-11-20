import { containsIdentifiers, scrubResourceUrl } from "./resourceUrl";

const EVM_ADDRESS = `0x${"a1b2".repeat(10)}`;
const SEGWIT_ADDRESS = "bc1qtest0address0for0unit0tests0only000";
const BASE58_ADDRESS = "1TestAddressForUnitTests2345678";
const TRON_ADDRESS = "TTestAddressForUnitTests23456789";
const STELLAR_ADDRESS = "GTESTADDRESSFORUNITTESTS234567ABCDEFGHIJKLMNOPQRSTUVWXY";
const ALGORAND_ADDRESS = "TESTADDRESSFORUNITTESTS234567ABCDEFGHIJKLMNOPQRSTUVWXYZ22";
const COSMOS_ADDRESS = "cosmos1test0address0for0unit0tests0only0";
const POLKADOT_ADDRESS = "1TestPolkadotAddressForUnitTests23456789ABCDEFG";
const KASPA_ADDRESS = "kaspa:qtest0address0for0unit0tests0only000";
const EXTENDED_PUBLIC_KEY = "xpub6TestExtendedPublicKeyForUnitTests0123456789";
const TRANSACTION_HASH = "ab12".repeat(16);
const URL_SAFE_TON_ADDRESS = `UQ${"Ab3-Cd4_".repeat(5)}Ef5Gh6`;
const HEDERA_TRANSACTIONS_URL =
  "https://hedera.example/api/v1/transactions?account.id=0.0.12345&limit=100&order=desc";
const TON_JETTON_WALLETS_URL = `https://ton.example/api/v3/jetton/wallets?limit=256&owner_address=${URL_SAFE_TON_ADDRESS}`;

describe("scrubResourceUrl", () => {
  it.each([
    [
      "the address of a UTXO explorer call",
      `https://explorers.example/blockchain/v4/btc/address/${SEGWIT_ADDRESS}/txs/pending`,
      "https://explorers.example/blockchain/v4/btc/address/[redacted]/txs/pending",
    ],
    [
      "the address of an EVM explorer call",
      `https://explorers.example/blockchain/v4/eth/address/${EVM_ADDRESS}/balance`,
      "https://explorers.example/blockchain/v4/eth/address/[redacted]/balance",
    ],
    [
      "a legacy address",
      `https://explorers.example/blockchain/v4/doge/address/${BASE58_ADDRESS}/txs`,
      "https://explorers.example/blockchain/v4/doge/address/[redacted]/txs",
    ],
    [
      "an account in a versioned explorer path",
      `https://explorers.example/v1/ethereum/v2/account/${TRANSACTION_HASH}`,
      "https://explorers.example/v1/ethereum/v2/account/[redacted]",
    ],
    [
      "a Tron account, keeping the sub-resource",
      `https://tron.example/v1/accounts/${TRON_ADDRESS}/transactions/trc20`,
      "https://tron.example/v1/accounts/[redacted]/transactions/trc20",
    ],
    [
      "a Stellar account",
      `https://stellar.example/accounts/${STELLAR_ADDRESS}/operations`,
      "https://stellar.example/accounts/[redacted]/operations",
    ],
    [
      "an Algorand account",
      `https://algorand.example/idx/v2/accounts/${ALGORAND_ADDRESS}`,
      "https://algorand.example/idx/v2/accounts/[redacted]",
    ],
    [
      "a Polkadot account",
      `https://polkadot.example/v1/accounts/${POLKADOT_ADDRESS}/balance-info`,
      "https://polkadot.example/v1/accounts/[redacted]/balance-info",
    ],
    [
      "a short account id that only its key reveals",
      "https://hedera.example/api/v1/accounts/0.0.12345",
      "https://hedera.example/api/v1/accounts/[redacted]",
    ],
    [
      "a named account",
      "https://near.example/v3/accounts/someone.near/txns",
      "https://near.example/v3/accounts/[redacted]/txns",
    ],
    [
      "a Cosmos delegator",
      `https://cosmos.example/cosmos/distribution/v1beta1/delegators/${COSMOS_ADDRESS}/rewards`,
      "https://cosmos.example/cosmos/distribution/v1beta1/delegators/[redacted]/rewards",
    ],
    [
      "a Cosmos balance owner",
      `https://cosmos.example/cosmos/bank/v1beta1/balances/${COSMOS_ADDRESS}`,
      "https://cosmos.example/cosmos/bank/v1beta1/balances/[redacted]",
    ],
    [
      "a Cosmos delegation owner",
      `https://cosmos.example/cosmos/staking/v1beta1/delegations/${COSMOS_ADDRESS}`,
      "https://cosmos.example/cosmos/staking/v1beta1/delegations/[redacted]",
    ],
    [
      "a prefixed address",
      `https://kaspa.example/addresses/${KASPA_ADDRESS}/full-transactions-page`,
      "https://kaspa.example/addresses/[redacted]/full-transactions-page",
    ],
    [
      "a reverse name lookup",
      `https://names.example/v2/names/ethereum/1/reverse/${EVM_ADDRESS}`,
      "https://names.example/v2/names/ethereum/1/reverse/[redacted]",
    ],
    [
      "a reverse resolution",
      `https://explorers.example/blockchain/v4/eth/ens/reverse-resolve/${EVM_ADDRESS}`,
      "https://explorers.example/blockchain/v4/eth/ens/reverse-resolve/[redacted]",
    ],
    [
      "a staking deposit lookup",
      "https://near.example/v3/kitwallet/staking-deposits/someone.near",
      "https://near.example/v3/kitwallet/staking-deposits/[redacted]",
    ],
    [
      "a portfolio id and the account under it",
      "https://portfolio.example/v1/portfolio/ledger-live-1234/accounts/base%3A0xabc/addresses",
      "https://portfolio.example/v1/portfolio/[redacted]/accounts/[redacted]/addresses",
    ],
    [
      "a transaction hash under any key",
      `https://explorers.example/blockchain/v4/btc/tx/${TRANSACTION_HASH}/hex`,
      "https://explorers.example/blockchain/v4/btc/tx/[redacted]/hex",
    ],
    [
      "an extended public key in an encoded account id",
      `https://api.example/v1/sync/js%3A2%3Abitcoin%3A${EXTENDED_PUBLIC_KEY}%3Anative_segwit`,
      "https://api.example/v1/sync/[redacted]",
    ],
    [
      "the address parameter of an explorer proxy",
      `https://etherscan.example/v2/api?module=account&action=txlist&address=${EVM_ADDRESS}&page=1`,
      "https://etherscan.example/v2/api?module=account&action=txlist&address=[redacted]&page=1",
    ],
    [
      "a parameter whose key reveals an account",
      "https://portfolio.example/v1/balance?account=base%3A0xabc&currency=usd",
      "https://portfolio.example/v1/balance?account=[redacted]&currency=usd",
    ],
    [
      "an identifier under any parameter",
      `https://vechain.example/transactions?id=0x${TRANSACTION_HASH}`,
      "https://vechain.example/transactions?id=[redacted]",
    ],
    [
      "one of several comma-separated values",
      `https://api.example/v1/balances?ids=bitcoin,${SEGWIT_ADDRESS}`,
      "https://api.example/v1/balances?ids=[redacted]",
    ],
    [
      "an identifier in a bare parameter",
      `https://api.example/v1/lookup?${EVM_ADDRESS}`,
      "https://api.example/v1/lookup?[redacted]",
    ],
    [
      "the account of a route in the fragment",
      `https://app.example/index.html#/account/js:2:ethereum:${EVM_ADDRESS}:`,
      "https://app.example/index.html#/account/[redacted]",
    ],
    [
      "an identifier in a relative URL",
      `/blockchain/v4/eth/address/${EVM_ADDRESS}/txs`,
      "/blockchain/v4/eth/address/[redacted]/txs",
    ],
    [
      "the segment after a key written in any case",
      "https://explorers.example/blockchain/v4/btc/Address/someone/utxo",
      "https://explorers.example/blockchain/v4/btc/Address/[redacted]/utxo",
    ],
    [
      "an encoded account id with a short address in a parameter",
      "https://api.example/v1/tokens?id=js%3A2%3Ahedera%3A0.0.12345%3Ahederabip44",
      "https://api.example/v1/tokens?id=[redacted]",
    ],
    [
      "a short account id under a key that names an account",
      HEDERA_TRANSACTIONS_URL,
      "https://hedera.example/api/v1/transactions?account.id=[redacted]&limit=100&order=desc",
    ],
    [
      "a URL-safe address under a key that names an owner",
      TON_JETTON_WALLETS_URL,
      "https://ton.example/api/v3/jetton/wallets?limit=256&owner_address=[redacted]",
    ],
    [
      "a URL-safe address under any key",
      `https://ton.example/api/v3/lookup/${URL_SAFE_TON_ADDRESS}/state`,
      "https://ton.example/api/v3/lookup/[redacted]/state",
    ],
    [
      "an account id with a short address in a path segment",
      "https://api.example/v1/sync/js:2:near:someone.near:/status",
      "https://api.example/v1/sync/[redacted]/status",
    ],
  ])("redacts %s", (_, url, expected) => {
    expect(scrubResourceUrl(url)).toBe(expected);
  });

  it.each([
    ["a countervalues call", "https://countervalues.example/v3/spot/simple?froms=bitcoin&to=usd"],
    ["a static file", "https://cdn.example/config/app.json?v=3.100.1"],
    ["a UUID", "https://api.example/v1/devices/123e4567-e89b-12d3-a456-426614174000"],
    ["a long name without digits", "https://rpc.example/v1/getAccountTransactionsHistory"],
    [
      "a block height",
      "https://explorers.example/blockchain/v4/btc/block/123456789012345678901234567",
    ],
    ["an empty parameter and a trailing slash", "https://api.example/v1/address/?address=&flag"],
    ["a currency id", "https://api.example/v1/tokens/ethereum/erc20/usd_tether__erc20_"],
    ["a time of day", "https://api.example/v1/schedule?at=12:30:00"],
    ["a text that is not a URL", "not a url"],
    ["a relative URL that embeds another one", "/redirect/https://cdn.example/app.json"],
    ["an empty query and fragment", "https://api.example/v1/status?#"],
    [
      "a long snake_case name",
      "https://api.example/v1/assets/some_long_snake_case_identifier_for_version_2024",
    ],
    ["a parameter named like an identifier but empty", "https://api.example/v1/x?owner_address="],
  ])("keeps %s unchanged", (_, url) => {
    expect(scrubResourceUrl(url)).toBe(url);
  });

  it("keeps the origin, including a host that mixes letters and digits", () => {
    expect(
      scrubResourceUrl(
        `https://cosmoshub4.coin.example/cosmos/auth/v1beta1/accounts/${COSMOS_ADDRESS}`,
      ),
    ).toBe("https://cosmoshub4.coin.example/cosmos/auth/v1beta1/accounts/[redacted]");
  });

  it("returns the same URL when scrubbed twice", () => {
    const url = `https://explorers.example/blockchain/v4/btc/address/${SEGWIT_ADDRESS}/txs?address=${EVM_ADDRESS}#/account/x`;
    const scrubbed = scrubResourceUrl(url);
    expect(scrubResourceUrl(scrubbed)).toBe(scrubbed);
  });
});

describe("containsIdentifiers", () => {
  it("is true when the URL holds an identifier", () => {
    expect(
      containsIdentifiers(`https://explorers.example/blockchain/v4/eth/address/${EVM_ADDRESS}/txs`),
    ).toBe(true);
  });

  it.each([
    ["a short account id under a key", HEDERA_TRANSACTIONS_URL],
    ["a URL-safe address", TON_JETTON_WALLETS_URL],
  ])("is true for %s", (_, url) => {
    expect(containsIdentifiers(url)).toBe(true);
  });

  it("is false when the URL holds none", () => {
    expect(containsIdentifiers("https://countervalues.example/v3/spot/simple?froms=bitcoin")).toBe(
      false,
    );
  });

  it("is false once the URL is scrubbed", () => {
    const url = `https://explorers.example/blockchain/v4/eth/address/${EVM_ADDRESS}/txs`;
    expect(containsIdentifiers(scrubResourceUrl(url))).toBe(false);
  });
});
