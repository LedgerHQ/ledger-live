"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentAccountName = exports.TokenAccount = exports.Account = void 0;
const Addresses_1 = require("./Addresses");
const Currency_1 = require("./Currency");
const TokenType_1 = require("./TokenType");
class Account {
    currency;
    accountName;
    index;
    accountPath;
    tokenType;
    ensName;
    derivationMode;
    parentAccount;
    address;
    constructor(currency, accountName, index, accountPath, tokenType, ensName, derivationMode, parentAccount, address) {
        this.currency = currency;
        this.accountName = accountName;
        this.index = index;
        this.accountPath = accountPath;
        this.tokenType = tokenType;
        this.ensName = ensName;
        this.derivationMode = derivationMode;
        this.parentAccount = parentAccount;
        this.address = address;
    }
    static ADA_1 = new Account(Currency_1.Currency.ADA, "Cardano 1", 0, "1852'/1815'/0'/0/3");
    static ADA_2 = new Account(Currency_1.Currency.ADA, "Cardano 2", 1, "1852'/1815'/1'/0/2");
    static ALGO_1 = new Account(Currency_1.Currency.ALGO, "Algorand 1", 0, "44'/283'/0'/0/0");
    static ALGO_2 = new Account(Currency_1.Currency.ALGO, "Algorand 2", 1, "44'/283'/1'/0/0");
    static APTOS_1 = new Account(Currency_1.Currency.APT, "Aptos 1", 0, "44'/637'/0'/0'/0'");
    static APTOS_2 = new Account(Currency_1.Currency.APT, "Aptos 2", 1, "44'/637'/1'/0'/0'");
    static ATOM_1 = new Account(Currency_1.Currency.ATOM, "Cosmos 1", 0, "44'/118'/0'/0/0");
    static ATOM_2 = new Account(Currency_1.Currency.ATOM, "Cosmos 2", 1, "44'/118'/1'/0/0");
    static BCH_1 = new Account(Currency_1.Currency.BCH, "Bitcoin Cash 1", 0, "44'/145'/0'/0/2", undefined, undefined, "cashaddr");
    static BCH_2 = new Account(Currency_1.Currency.BCH, "Bitcoin Cash 2", 1, "44'/145'/1'/0/2", undefined, undefined, "cashaddr");
    static BSC_1 = new Account(Currency_1.Currency.BSC, "BNB Chain 1", 0, "44'/60'/0'/0/0");
    static BSC_2 = new Account(Currency_1.Currency.BSC, "BNB Chain 2", 1, "44'/60'/1'/0/0");
    static BTC_LEGACY_1 = new Account(Currency_1.Currency.BTC, "Bitcoin 1", 0, "44'/0'/0'/0/1", undefined, undefined, "");
    static BTC_LEGACY_2 = new Account(Currency_1.Currency.BTC, "Bitcoin 2", 1, "44'/0'/1'/0/0", undefined, "");
    static BTC_NATIVE_SEGWIT_1 = new Account(Currency_1.Currency.BTC, "Bitcoin 1", 0, "84'/0'/0'/0/3", undefined, undefined, "native_segwit");
    static BTC_NATIVE_SEGWIT_2 = new Account(Currency_1.Currency.BTC, "Bitcoin 2", 1, "84'/0'/1'/0/1", undefined, undefined, "native_segwit");
    static BTC_SEGWIT_1 = new Account(Currency_1.Currency.BTC, "Bitcoin 1", 0, "49'/0'/0'/0/1", undefined, undefined, "segwit");
    static BTC_SEGWIT_2 = new Account(Currency_1.Currency.BTC, "Bitcoin 2", 1, "49'/0'/1'/0/0", undefined, undefined, "segwit");
    static BTC_TAPROOT_1 = new Account(Currency_1.Currency.BTC, "Bitcoin 1", 0, "86'/0'/0'/0/1", undefined, undefined, "taproot");
    static BTC_TAPROOT_2 = new Account(Currency_1.Currency.BTC, "Bitcoin 2", 1, "86'/0'/1'/0/0", undefined, undefined, "taproot");
    static CCD_TESTNET_1 = new Account(Currency_1.Currency.CCD_TESTNET, "Concordium (Testnet) 1", 0, "44'/1'/0'/0'/0'/0'");
    static CCD_TESTNET_2 = new Account(Currency_1.Currency.CCD_TESTNET, "Concordium (Testnet) 2", 1, "44'/1'/0'/0'/0'/1'");
    static CELO_1 = new Account(Currency_1.Currency.CELO, "Celo 1", 0, "44'/52752'/0'/0/0");
    static DOGE_1 = new Account(Currency_1.Currency.DOGE, "Dogecoin 1", 0, "44'/3'/0'/0/1");
    static DOGE_2 = new Account(Currency_1.Currency.DOGE, "Dogecoin 2", 1, "44'/3'/1'/0/1");
    static DOT_1 = new Account(Currency_1.Currency.DOT, "Polkadot 1", 0, "44'/354'/0'/0'/0'");
    static DOT_2 = new Account(Currency_1.Currency.DOT, "Polkadot 2", 1, "44'/354'/1'/0'/0'");
    static DOT_3 = new Account(Currency_1.Currency.DOT, "Polkadot 3", 2, "44'/354'/2'/0'/0'");
    static ETH_1 = new Account(Currency_1.Currency.ETH, "Ethereum 1", 0, "44'/60'/0'/0/0", undefined, undefined, undefined);
    // don't use this account as a recipient, it's balance
    // should stay close to null to allow for error message testing
    static ETH_2 = new Account(Currency_1.Currency.ETH, "Ethereum 2", 1, "44'/60'/1'/0/0", undefined);
    static ETH_2_WITH_ENS = new Account(Currency_1.Currency.ETH, "Ethereum 2", 1, "44'/60'/1'/0/0", undefined, "speculos-qaa.eth");
    static ETH_2_LOWER_CASE = new Account(Currency_1.Currency.ETH, "Ethereum 2", 1, "44'/60'/1'/0/0");
    static ETH_3 = new Account(Currency_1.Currency.ETH, "Ethereum 3", 2, "44'/60'/2'/0/0");
    static SANCTIONED_ETH = new Account(Currency_1.Currency.ETH, "Sanctioned Ethereum", 0, "");
    // Hedera accounts use pre-configured addresses because account IDs cannot be derived from path
    static HEDERA_1 = new Account(Currency_1.Currency.HBAR, "Hedera 1", 0, "44/3030", undefined, undefined, undefined, undefined, "0.0.10310433");
    static HEDERA_2 = new Account(Currency_1.Currency.HBAR, "Hedera 2", 1, "44/3030", undefined, undefined, undefined, undefined, "0.0.10337251");
    static INJ_1 = new Account(Currency_1.Currency.INJ, "Injective 1", 0, "44'/60'/0'/0/0");
    static KASPA_1 = new Account(Currency_1.Currency.KAS, "KASPA 1", 0, "44'/111111'/0'/0/2");
    static KASPA_2 = new Account(Currency_1.Currency.KAS, "KASPA 2", 1, "44'/111111'/1'/0/1");
    static LTC_1 = new Account(Currency_1.Currency.LTC, "Litecoin 1", 0, "84'/2'/0'/0/0");
    static MINA_1 = new Account(Currency_1.Currency.MINA, "Mina 1", 0, "44'/12586'/0'/0/0");
    static MINA_2 = new Account(Currency_1.Currency.MINA, "Mina 2", 1, "44'/12586'/1'/0/0");
    static MULTIVERS_X_1 = new Account(Currency_1.Currency.MULTIVERS_X, "MultiversX 1", 0, "44'/508'/0'/0/0");
    static MULTIVERS_X_2 = new Account(Currency_1.Currency.MULTIVERS_X, "MultiversX 2", 1, "44'/508'/1'/0/0");
    static NEAR_1 = new Account(Currency_1.Currency.NEAR, "NEAR 1", 0, "44'/397'/0'/0'/0'");
    static NEAR_2 = new Account(Currency_1.Currency.NEAR, "NEAR 2", 1, "44'/397'/0'/0'/1'");
    static OSMO_1 = new Account(Currency_1.Currency.OSMO, "Osmosis 1", 0, "44'/118'/0'/0/0");
    static OSMO_2 = new Account(Currency_1.Currency.OSMO, "Osmosis 2", 1, "44'/118'/1'/0/0");
    static POL_1 = new Account(Currency_1.Currency.POL, "Polygon 1", 0, "44'/60'/0'/0/0", undefined, undefined, undefined);
    static POL_2 = new Account(Currency_1.Currency.POL, "Polygon 2", 1, "44'/60'/1'/0/0");
    static SOL_1 = new Account(Currency_1.Currency.SOL, "Solana 1", 0, "44'/501'/0'");
    static SOL_2 = new Account(Currency_1.Currency.SOL, "Solana 2", 1, "44'/501'/1'");
    static SOL_3 = new Account(Currency_1.Currency.SOL, "Solana 3", 2, "44'/501'/2'");
    static SOL_4 = new Account(Currency_1.Currency.SOL, "Solana 4", 3, "44'/501'/3'");
    static TRX_1 = new Account(Currency_1.Currency.TRX, "Tron 1", 0, "44'/195'/0'/0/0");
    static TRX_2 = new Account(Currency_1.Currency.TRX, "Tron 2", 1, "44'/195'/1'/0/0");
    static TRX_3 = new Account(Currency_1.Currency.TRX, "Tron 3", 2, "44'/195'/2'/0/0");
    static XLM_1 = new Account(Currency_1.Currency.XLM, "Stellar 1", 0, "44'/148'/0'");
    static XLM_2 = new Account(Currency_1.Currency.XLM, "Stellar 2", 1, "44'/148'/1'");
    static XRP_1 = new Account(Currency_1.Currency.XRP, "XRP 1", 0, "44'/144'/0'/0/0");
    static XRP_2 = new Account(Currency_1.Currency.XRP, "XRP 2", 1, "44'/144'/1'/0/0");
    static XRP_3 = new Account(Currency_1.Currency.XRP, "XRP 3", 2, "44'/144'/2'/0/0");
    static XTZ_1 = new Account(Currency_1.Currency.XTZ, "Tezos 1", 0, "44'/1729'/0'/0'");
    static XTZ_2 = new Account(Currency_1.Currency.XTZ, "Tezos 2", 1, "44'/1729'/1'/0'");
    static sep_ETH_1 = new Account(Currency_1.Currency.sepETH, "Ethereum Sepolia 1", 0, "44'/60'/0'/0/0");
    static sep_ETH_2 = new Account(Currency_1.Currency.sepETH, "Ethereum Sepolia 2", 1, "44'/60'/0'/1/0");
    static SUI_1 = new Account(Currency_1.Currency.SUI, "Sui 1", 0, "44'/784'/0'/0'/0'");
    static SUI_2 = new Account(Currency_1.Currency.SUI, "Sui 2", 1, "44'/784'/1'/0'/0'");
    static BASE_1 = new Account(Currency_1.Currency.BASE, "Base 1", 0, "44'/60'/0'/0/0");
    static BASE_2 = new Account(Currency_1.Currency.BASE, "Base 2", 1, "44'/60'/1'/0/0");
    static OP_1 = new Account(Currency_1.Currency.OP, "OP Mainnet 1", 0, "44'/60'/0'/0/0");
    static VET_1 = new Account(Currency_1.Currency.VET, "Vechain 1", 0, "44'/818'/0'/0/0");
    static VET_2 = new Account(Currency_1.Currency.VET, "Vechain 2", 1, "44'/818'/0'/0/1");
    static ZEC_1 = new Account(Currency_1.Currency.ZEC, "Zcash 1", 0, "44'/133'/0'/0/6");
    static ZEC_2 = new Account(Currency_1.Currency.ZEC, "Zcash 2", 1, "44'/133'/1'/0/3");
    static ICP_1 = new Account(Currency_1.Currency.ICP, "Internet Computer 1", 0, "44'/223'/0'/0/0");
    static ICP_2 = new Account(Currency_1.Currency.ICP, "Internet Computer 2", 1, "44'/223'/1'/0/0");
    static SEI_EVM_1 = new Account(Currency_1.Currency.SEI_EVM, "SEI Network (EVM) 1", 0, "44'/60'/0'/0/0");
    static SEI_EVM_2 = new Account(Currency_1.Currency.SEI_EVM, "SEI Network (EVM) 2", 1, "44'/60'/1'/0/0");
    static EMPTY = new Account(Currency_1.Currency.BTC, "Empty", 0, "");
}
exports.Account = Account;
class TokenAccount extends Account {
    constructor(currency, accountName, index, path, tokenType, parentAccount, ensName, derivationMode, address) {
        super(currency, accountName, index, path, tokenType, ensName, derivationMode, parentAccount, address);
    }
    static ETH_LIDO = new TokenAccount(Currency_1.Currency.ETH_LIDO, "LIDO Staked ETH 1", 0, Account.ETH_1.accountPath, TokenType_1.TokenType.ERC20, Account.ETH_1);
    static ETH_USDC_1 = new TokenAccount(Currency_1.Currency.ETH_USDC, "USD Coin 1", 0, Account.ETH_1.accountPath, TokenType_1.TokenType.ERC20, Account.ETH_1);
    static ETH_USDT_1 = new TokenAccount(Currency_1.Currency.ETH_USDT, "Tether USD 1", 0, Account.ETH_1.accountPath, TokenType_1.TokenType.ERC20, Account.ETH_1);
    static ETH_USDT_2 = new TokenAccount(Currency_1.Currency.ETH_USDT, "Tether USD 2", 1, Account.ETH_2.accountPath, TokenType_1.TokenType.ERC20, Account.ETH_2);
    static ETH_USDT_3 = new TokenAccount(Currency_1.Currency.ETH_USDT, "Tether USD 3", 2, Account.ETH_3.accountPath, TokenType_1.TokenType.ERC20, Account.ETH_3);
    static SOL_GIGA_1 = new TokenAccount(Currency_1.Currency.SOL_GIGA, "GIGACHAD 1", 0, Account.SOL_1.accountPath, TokenType_1.TokenType.SPL, Account.SOL_1, undefined, undefined, Addresses_1.Addresses.SOL_GIGA_1_ATA_ADDRESS);
    static SOL_GIGA_2 = new TokenAccount(Currency_1.Currency.SOL_GIGA, "GIGACHAD 2", 1, Account.SOL_2.accountPath, TokenType_1.TokenType.SPL, Account.SOL_2, undefined, undefined, Addresses_1.Addresses.SOL_GIGA_2_ATA_ADDRESS);
    static SOL_GIGA_3 = new TokenAccount(Currency_1.Currency.SOL_GIGA, "GIGACHAD 3", 2, Account.SOL_3.accountPath, TokenType_1.TokenType.SPL, Account.SOL_3);
    static SOL_WIF_1 = new TokenAccount(Currency_1.Currency.SOL_WIF, "dogwifhat 1", 0, Account.SOL_1.accountPath, TokenType_1.TokenType.SPL, Account.SOL_1);
    static SOL_WIF_2 = new TokenAccount(Currency_1.Currency.SOL_WIF, "dogwifhat 2", 1, Account.SOL_2.accountPath, TokenType_1.TokenType.SPL, Account.SOL_2);
    static TRX_BTT = new TokenAccount(Currency_1.Currency.TRX_BTT, "BitTorrent", 0, Account.TRX_1.accountPath, TokenType_1.TokenType.TRC20, Account.TRX_1);
    static SUI_USDC_1 = new TokenAccount(Currency_1.Currency.SUI_USDC, "SUI USDC 1", 0, Account.SUI_1.accountPath, TokenType_1.TokenType.COIN, Account.SUI_1);
    static SUI_USDC_2 = new TokenAccount(Currency_1.Currency.SUI_USDC, "SUI USDC 2", 1, Account.SUI_2.accountPath, TokenType_1.TokenType.COIN, Account.SUI_2);
    static BSC_BUSD_1 = new TokenAccount(Currency_1.Currency.BSC_BUSD, "Binance-Peg BUSD Token 1", 0, Account.BSC_1.accountPath, TokenType_1.TokenType.ERC20, Account.BSC_1);
    static BSC_BUSD_2 = new TokenAccount(Currency_1.Currency.BSC_BUSD, "Binance-Peg BUSD Token 2", 1, Account.BSC_2.accountPath, TokenType_1.TokenType.ERC20, Account.BSC_2);
    static ALGO_USDT_1 = new TokenAccount(Currency_1.Currency.ALGO_USDT, "Tether USDt 1", 0, Account.ALGO_1.accountPath, TokenType_1.TokenType.ERC20, Account.ALGO_1);
    static ALGO_USDT_2 = new TokenAccount(Currency_1.Currency.ALGO_USDT, "Tether USDt 2", 1, Account.ALGO_2.accountPath, TokenType_1.TokenType.ERC20, Account.ALGO_2);
    static XLM_USDC = new TokenAccount(Currency_1.Currency.XLM_USDC, "USDC 1", 0, Account.XLM_1.accountPath, TokenType_1.TokenType.ERC20, Account.XLM_1);
    static POL_DAI_1 = new TokenAccount(Currency_1.Currency.POL_DAI, "Dai 1", 0, "44'/60'/0'/0/0", TokenType_1.TokenType.ERC20, Account.POL_1);
    static POL_UNI = new TokenAccount(Currency_1.Currency.POL_UNI, "Uniswap 1", 0, "44'/60'/0'/0/0", TokenType_1.TokenType.ERC20, Account.POL_1);
    static TRX_USDT = new TokenAccount(Currency_1.Currency.TRX_USDT, "Tron 1", 0, "44'/195'/0'/0/0", TokenType_1.TokenType.TRC20, Account.TRX_1);
}
exports.TokenAccount = TokenAccount;
const getParentAccountName = (account) => {
    if ("parentAccount" in account && Boolean(account.tokenType)) {
        return account.parentAccount.accountName;
    }
    return account.accountName;
};
exports.getParentAccountName = getParentAccountName;
//# sourceMappingURL=Account.js.map