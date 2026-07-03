"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currency = void 0;
const AppInfos_1 = require("./AppInfos");
const Network_1 = require("./Network");
class Currency {
    name;
    ticker;
    id;
    speculosApp;
    networks;
    contractAddress;
    constructor(name, ticker, id, speculosApp, networks, contractAddress) {
        this.name = name;
        this.ticker = ticker;
        this.id = id;
        this.speculosApp = speculosApp;
        this.networks = networks;
        this.contractAddress = contractAddress;
    }
    toString() {
        return this.ticker;
    }
    static CELO = new Currency("Celo", "CELO", "celo", AppInfos_1.AppInfos.CELO, [Network_1.Network.CELO]);
    static INJ = new Currency("Injective", "INJ", "injective", AppInfos_1.AppInfos.INJECTIVE, [
        Network_1.Network.INJECTIVE,
    ]);
    static BTC = new Currency("Bitcoin", "BTC", "bitcoin", AppInfos_1.AppInfos.BITCOIN, [
        Network_1.Network.BITCOIN,
    ]);
    static APT = new Currency("Aptos", "APT", "aptos", AppInfos_1.AppInfos.APTOS, [Network_1.Network.APTOS]);
    static ZEC = new Currency("Zcash", "ZEC", "zcash", AppInfos_1.AppInfos.ZCASH, [Network_1.Network.ZCASH]);
    static KAS = new Currency("Kaspa", "KAS", "kaspa", AppInfos_1.AppInfos.KASPA, [Network_1.Network.KASPA]);
    static HBAR = new Currency("Hedera", "HBAR", "hedera", AppInfos_1.AppInfos.HEDERA, [
        Network_1.Network.HEDERA,
    ]);
    static tBTC = new Currency("Bitcoin Testnet", "𝚝BTC", "bitcoin_testnet", AppInfos_1.AppInfos.BITCOIN_TESTNET, [Network_1.Network.BITCOIN_TESTNET]);
    static DOGE = new Currency("Dogecoin", "DOGE", "dogecoin", AppInfos_1.AppInfos.DOGECOIN, [
        Network_1.Network.DOGECOIN,
    ]);
    static ETH = new Currency("Ethereum", "ETH", "ethereum", AppInfos_1.AppInfos.ETHEREUM, [Network_1.Network.ETHEREUM], "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    static sepETH = new Currency("Ethereum Sepolia", "ETH", "ethereum_sepolia", AppInfos_1.AppInfos.ETHEREUM_SEPOLIA, [Network_1.Network.ETHEREUM_SEPOLIA]);
    static ETC = new Currency("Ethereum Classic", "ETC", "ethereum_classic", AppInfos_1.AppInfos.ETHEREUM_CLASSIC, [Network_1.Network.ETHEREUM_CLASSIC]);
    static SOL = new Currency("Solana", "SOL", "solana", AppInfos_1.AppInfos.SOLANA, [Network_1.Network.SOLANA]);
    static DOT = new Currency("Polkadot", "DOT", "assethub_polkadot", AppInfos_1.AppInfos.POLKADOT, [
        Network_1.Network.POLKADOT,
    ]);
    static TRX = new Currency("Tron", "TRX", "tron", AppInfos_1.AppInfos.TRON, [Network_1.Network.TRON]);
    static XRP = new Currency("XRP", "XRP", "ripple", AppInfos_1.AppInfos.RIPPLE, [Network_1.Network.XRP]);
    static ADA = new Currency("Cardano", "ADA", "cardano", AppInfos_1.AppInfos.CARDANO, [
        Network_1.Network.CARDANO,
    ]);
    static XLM = new Currency("Stellar", "XLM", "stellar", AppInfos_1.AppInfos.STELLAR, [
        Network_1.Network.STELLAR,
    ]);
    static BCH = new Currency("Bitcoin Cash", "BCH", "bitcoin_cash", AppInfos_1.AppInfos.BITCOIN_CASH, [
        Network_1.Network.BITCOIN_CASH,
    ]);
    static ALGO = new Currency("Algorand", "ALGO", "algorand", AppInfos_1.AppInfos.ALGORAND, [
        Network_1.Network.ALGORAND,
    ]);
    static ATOM = new Currency("Cosmos", "ATOM", "cosmos", AppInfos_1.AppInfos.COSMOS, [
        Network_1.Network.COSMOS,
    ]);
    static XTZ = new Currency("Tezos", "XTZ", "tezos", AppInfos_1.AppInfos.TEZOS, [Network_1.Network.TEZOS]);
    static POL = new Currency("Polygon", "POL", "polygon", AppInfos_1.AppInfos.POLYGON, [
        Network_1.Network.POLYGON,
    ]);
    static BSC = new Currency("BNB Chain", "BNB", "bsc", AppInfos_1.AppInfos.BNB_CHAIN, [
        Network_1.Network.BNB_CHAIN,
    ]);
    static TON = new Currency("Gram", "GRAM", "ton", AppInfos_1.AppInfos.TON, [Network_1.Network.TON]);
    static ETH_USDT = new Currency("Tether USD", "USDT", "ethereum/erc20/usd_tether__erc20_", AppInfos_1.AppInfos.ETHEREUM, [
        Network_1.Network.ETHEREUM,
        Network_1.Network.ARBITRUM,
        Network_1.Network.POLYGON,
        Network_1.Network.OPTIMISM,
        Network_1.Network.BASE,
        Network_1.Network.SCROLL,
    ], "0xdac17f958d2ee523a2206206994597c13d831ec7");
    static ETH_USDC = new Currency("USD Coin", "USDC", "ethereum/erc20/usd__coin", AppInfos_1.AppInfos.ETHEREUM, [
        Network_1.Network.ETHEREUM,
        Network_1.Network.ARBITRUM,
        Network_1.Network.POLYGON,
        Network_1.Network.OPTIMISM,
        Network_1.Network.BASE,
        Network_1.Network.SCROLL,
    ], "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    static ETH_LIDO = new Currency("LIDO Staked ETH", "STETH", "ethereum/erc20/steth", AppInfos_1.AppInfos.ETHEREUM, [Network_1.Network.ETHEREUM]);
    static XLM_USDC = new Currency("USDC", "USDC", "stellar", AppInfos_1.AppInfos.STELLAR, [
        Network_1.Network.STELLAR,
    ]);
    static ALGO_USDT = new Currency("Tether USDt", "USDT", "algorand", AppInfos_1.AppInfos.ALGORAND, [
        Network_1.Network.ALGORAND,
    ]);
    static TRX_USDT = new Currency("Tether USD", "USDT", "tron", AppInfos_1.AppInfos.TRON, [
        Network_1.Network.TRON,
    ]);
    static TRX_BTT = new Currency("BitTorrent", "BTT", "tron", AppInfos_1.AppInfos.TRON, [
        Network_1.Network.TRON,
    ]);
    static BSC_BUSD = new Currency("Binance-Peg BUSD Token", "BUSD", "bsc", AppInfos_1.AppInfos.BNB_CHAIN, [Network_1.Network.BNB_CHAIN, Network_1.Network.POLYGON]);
    static POL_DAI = new Currency("(PoS) Dai Stablecoin", "DAI", "polygon", AppInfos_1.AppInfos.POLYGON, [Network_1.Network.POLYGON]);
    static POL_UNI = new Currency("Uniswap (PoS)", "UNI", "polygon", AppInfos_1.AppInfos.POLYGON, [
        Network_1.Network.POLYGON,
    ]);
    static NEAR = new Currency("NEAR", "NEAR", "near", AppInfos_1.AppInfos.NEAR, [Network_1.Network.NEAR]);
    static OSMO = new Currency("Osmosis", "OSMO", "osmo", AppInfos_1.AppInfos.OSMOSIS, [
        Network_1.Network.OSMOSIS,
    ]);
    static MULTIVERS_X = new Currency("MultiversX", "EGLD", "elrond", AppInfos_1.AppInfos.MULTIVERS_X, [
        Network_1.Network.MULTIVERS_X,
    ]);
    static LTC = new Currency("Litecoin", "LTC", "litecoin", AppInfos_1.AppInfos.LTC, [
        Network_1.Network.LITECOIN,
    ]);
    static SOL_GIGA = new Currency("GIGACHAD", "GIGA", "solana", AppInfos_1.AppInfos.SOLANA, [Network_1.Network.SOLANA], "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9");
    static SOL_WIF = new Currency("DOGWIFHAT", "WIF", "solana", AppInfos_1.AppInfos.SOLANA, [Network_1.Network.SOLANA], "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm");
    static OP = new Currency("OP Mainnet", "OP", "optimism", AppInfos_1.AppInfos.ETHEREUM, [
        Network_1.Network.OPTIMISM,
    ]);
    static SUI = new Currency("Sui", "SUI", "sui", AppInfos_1.AppInfos.SUI, [Network_1.Network.SUI]);
    static BASE = new Currency("Base", "ETH", "base", AppInfos_1.AppInfos.BASE, [Network_1.Network.BASE]);
    static VET = new Currency("Vechain", "VET", "vechain", AppInfos_1.AppInfos.VECHAIN, [
        Network_1.Network.VECHAIN,
    ]);
    static MINA = new Currency("Mina", "MINA", "mina", AppInfos_1.AppInfos.MINA, [Network_1.Network.MINA]);
    static SUI_USDC = new Currency("USD Coin", "USDC", "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc", AppInfos_1.AppInfos.SUI, [Network_1.Network.SUI], "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7");
    static ALEO = new Currency("Aleo", "ALEO", "aleo", AppInfos_1.AppInfos.ALEO, [Network_1.Network.ALEO]);
    static ICP = new Currency("Internet Computer", "ICP", "internet_computer", AppInfos_1.AppInfos.INTERNET_COMPUTER, [Network_1.Network.INTERNET_COMPUTER]);
    static CCD_TESTNET = new Currency("Concordium (Testnet)", "CCD", "concordium_testnet", AppInfos_1.AppInfos.CONCORDIUM_TESTNET, [Network_1.Network.CONCORDIUM]);
    static SEI_EVM = new Currency("SEI Network (EVM)", "SEI", "sei_evm", AppInfos_1.AppInfos.SEI, [
        Network_1.Network.SEI,
    ]);
}
exports.Currency = Currency;
//# sourceMappingURL=Currency.js.map