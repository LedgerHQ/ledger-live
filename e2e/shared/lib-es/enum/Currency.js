import { AppInfos } from "./AppInfos";
import { Network } from "./Network";
export class Currency {
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
    static CELO = new Currency("Celo", "CELO", "celo", AppInfos.CELO, [Network.CELO]);
    static INJ = new Currency("Injective", "INJ", "injective", AppInfos.INJECTIVE, [
        Network.INJECTIVE,
    ]);
    static BTC = new Currency("Bitcoin", "BTC", "bitcoin", AppInfos.BITCOIN, [
        Network.BITCOIN,
    ]);
    static APT = new Currency("Aptos", "APT", "aptos", AppInfos.APTOS, [Network.APTOS]);
    static ZEC = new Currency("Zcash", "ZEC", "zcash", AppInfos.ZCASH, [Network.ZCASH]);
    static KAS = new Currency("Kaspa", "KAS", "kaspa", AppInfos.KASPA, [Network.KASPA]);
    static HBAR = new Currency("Hedera", "HBAR", "hedera", AppInfos.HEDERA, [
        Network.HEDERA,
    ]);
    static tBTC = new Currency("Bitcoin Testnet", "𝚝BTC", "bitcoin_testnet", AppInfos.BITCOIN_TESTNET, [Network.BITCOIN_TESTNET]);
    static DOGE = new Currency("Dogecoin", "DOGE", "dogecoin", AppInfos.DOGECOIN, [
        Network.DOGECOIN,
    ]);
    static ETH = new Currency("Ethereum", "ETH", "ethereum", AppInfos.ETHEREUM, [Network.ETHEREUM], "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    static sepETH = new Currency("Ethereum Sepolia", "ETH", "ethereum_sepolia", AppInfos.ETHEREUM_SEPOLIA, [Network.ETHEREUM_SEPOLIA]);
    static ETC = new Currency("Ethereum Classic", "ETC", "ethereum_classic", AppInfos.ETHEREUM_CLASSIC, [Network.ETHEREUM_CLASSIC]);
    static SOL = new Currency("Solana", "SOL", "solana", AppInfos.SOLANA, [Network.SOLANA]);
    static DOT = new Currency("Polkadot", "DOT", "assethub_polkadot", AppInfos.POLKADOT, [
        Network.POLKADOT,
    ]);
    static TRX = new Currency("Tron", "TRX", "tron", AppInfos.TRON, [Network.TRON]);
    static XRP = new Currency("XRP", "XRP", "ripple", AppInfos.RIPPLE, [Network.XRP]);
    static ADA = new Currency("Cardano", "ADA", "cardano", AppInfos.CARDANO, [
        Network.CARDANO,
    ]);
    static XLM = new Currency("Stellar", "XLM", "stellar", AppInfos.STELLAR, [
        Network.STELLAR,
    ]);
    static BCH = new Currency("Bitcoin Cash", "BCH", "bitcoin_cash", AppInfos.BITCOIN_CASH, [
        Network.BITCOIN_CASH,
    ]);
    static ALGO = new Currency("Algorand", "ALGO", "algorand", AppInfos.ALGORAND, [
        Network.ALGORAND,
    ]);
    static ATOM = new Currency("Cosmos", "ATOM", "cosmos", AppInfos.COSMOS, [
        Network.COSMOS,
    ]);
    static XTZ = new Currency("Tezos", "XTZ", "tezos", AppInfos.TEZOS, [Network.TEZOS]);
    static POL = new Currency("Polygon", "POL", "polygon", AppInfos.POLYGON, [
        Network.POLYGON,
    ]);
    static BSC = new Currency("BNB Chain", "BNB", "bsc", AppInfos.BNB_CHAIN, [
        Network.BNB_CHAIN,
    ]);
    static TON = new Currency("Gram", "GRAM", "ton", AppInfos.TON, [Network.TON]);
    static ETH_USDT = new Currency("Tether USD", "USDT", "ethereum/erc20/usd_tether__erc20_", AppInfos.ETHEREUM, [
        Network.ETHEREUM,
        Network.ARBITRUM,
        Network.POLYGON,
        Network.OPTIMISM,
        Network.BASE,
        Network.SCROLL,
    ], "0xdac17f958d2ee523a2206206994597c13d831ec7");
    static ETH_USDC = new Currency("USD Coin", "USDC", "ethereum/erc20/usd__coin", AppInfos.ETHEREUM, [
        Network.ETHEREUM,
        Network.ARBITRUM,
        Network.POLYGON,
        Network.OPTIMISM,
        Network.BASE,
        Network.SCROLL,
    ], "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    static ETH_LIDO = new Currency("LIDO Staked ETH", "STETH", "ethereum/erc20/steth", AppInfos.ETHEREUM, [Network.ETHEREUM]);
    static XLM_USDC = new Currency("USDC", "USDC", "stellar", AppInfos.STELLAR, [
        Network.STELLAR,
    ]);
    static ALGO_USDT = new Currency("Tether USDt", "USDT", "algorand", AppInfos.ALGORAND, [
        Network.ALGORAND,
    ]);
    static TRX_USDT = new Currency("Tether USD", "USDT", "tron", AppInfos.TRON, [
        Network.TRON,
    ]);
    static TRX_BTT = new Currency("BitTorrent", "BTT", "tron", AppInfos.TRON, [
        Network.TRON,
    ]);
    static BSC_BUSD = new Currency("Binance-Peg BUSD Token", "BUSD", "bsc", AppInfos.BNB_CHAIN, [Network.BNB_CHAIN, Network.POLYGON]);
    static POL_DAI = new Currency("(PoS) Dai Stablecoin", "DAI", "polygon", AppInfos.POLYGON, [Network.POLYGON]);
    static POL_UNI = new Currency("Uniswap (PoS)", "UNI", "polygon", AppInfos.POLYGON, [
        Network.POLYGON,
    ]);
    static NEAR = new Currency("NEAR", "NEAR", "near", AppInfos.NEAR, [Network.NEAR]);
    static OSMO = new Currency("Osmosis", "OSMO", "osmo", AppInfos.OSMOSIS, [
        Network.OSMOSIS,
    ]);
    static MULTIVERS_X = new Currency("MultiversX", "EGLD", "elrond", AppInfos.MULTIVERS_X, [
        Network.MULTIVERS_X,
    ]);
    static LTC = new Currency("Litecoin", "LTC", "litecoin", AppInfos.LTC, [
        Network.LITECOIN,
    ]);
    static SOL_GIGA = new Currency("GIGACHAD", "GIGA", "solana", AppInfos.SOLANA, [Network.SOLANA], "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9");
    static SOL_WIF = new Currency("DOGWIFHAT", "WIF", "solana", AppInfos.SOLANA, [Network.SOLANA], "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm");
    static OP = new Currency("OP Mainnet", "OP", "optimism", AppInfos.ETHEREUM, [
        Network.OPTIMISM,
    ]);
    static SUI = new Currency("Sui", "SUI", "sui", AppInfos.SUI, [Network.SUI]);
    static BASE = new Currency("Base", "ETH", "base", AppInfos.BASE, [Network.BASE]);
    static VET = new Currency("Vechain", "VET", "vechain", AppInfos.VECHAIN, [
        Network.VECHAIN,
    ]);
    static MINA = new Currency("Mina", "MINA", "mina", AppInfos.MINA, [Network.MINA]);
    static SUI_USDC = new Currency("USD Coin", "USDC", "sui/coin/usdc_0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::usdc", AppInfos.SUI, [Network.SUI], "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7");
    static ALEO = new Currency("Aleo", "ALEO", "aleo", AppInfos.ALEO, [Network.ALEO]);
    static ICP = new Currency("Internet Computer", "ICP", "internet_computer", AppInfos.INTERNET_COMPUTER, [Network.INTERNET_COMPUTER]);
    static CCD_TESTNET = new Currency("Concordium (Testnet)", "CCD", "concordium_testnet", AppInfos.CONCORDIUM_TESTNET, [Network.CONCORDIUM]);
    static SEI_EVM = new Currency("SEI Network (EVM)", "SEI", "sei_evm", AppInfos.SEI, [
        Network.SEI,
    ]);
}
//# sourceMappingURL=Currency.js.map