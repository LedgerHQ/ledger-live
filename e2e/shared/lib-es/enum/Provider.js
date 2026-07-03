import { AppInfos } from "./AppInfos";
export class BaseProvider {
    name;
    uiName;
    constructor(name, uiName) {
        this.name = name;
        this.uiName = uiName;
    }
    static getByUiName(uiName) {
        return Object.values(this).find((p) => p instanceof BaseProvider && p.uiName === uiName);
    }
    static getNameByUiName(uiName) {
        return this.getByUiName(uiName)?.name ?? "";
    }
}
export class SwapProvider extends BaseProvider {
    kyc;
    availableOnLns;
    contractAddress;
    app;
    constructor(name, uiName, kyc, availableOnLns, contractAddress, app) {
        super(name, uiName);
        this.kyc = kyc;
        this.availableOnLns = availableOnLns;
        this.contractAddress = contractAddress;
        this.app = app;
    }
    // TODO: re-enable once Changelly provider is re-enabled
    //static readonly CHANGELLY = new SwapProvider("changelly_v2", "Changelly", false, true);
    static EXODUS = new SwapProvider("exodus", "Exodus", false, true);
    static MOONPAY = new SwapProvider("moonpay", "MoonPay", true, true);
    static CIC = new SwapProvider("cic_v2", "CIC", false, true);
    static NEAR_INTENTS = new SwapProvider("nearintents", "NEAR Intents", false, true);
    static SWAPSXYZ = new SwapProvider("swapsxyz", "Swaps.xyz", false, true);
    static MOONPAY_TRADE = new SwapProvider("moonpay_trade", "MoonPay Trade", false, true);
    static THORCHAIN = new SwapProvider("thorswap", "THORChain", false, false, "0xD37BbE5744D730a1d98d8DC97c42F0Ca46aD7146");
    static LIFI = new SwapProvider("lifi", "LI.FI", false, false, "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE");
    static UNISWAP = new SwapProvider("uniswap", "Uniswap", false, false, "0x000000000022D473030F116dDEE9F6B43aC78BA3", AppInfos.ETHEREUM);
    static ONE_INCH = new SwapProvider("oneinch", "1inch", false, true, "0x111111125421cA6dc452d289314280a0f8842A65", AppInfos.ONE_INCH);
    static VELORA = new SwapProvider("velora", "Velora", false, true, "0x6A000F20005980200259B80c5102003040001068", AppInfos.VELORA);
    static OKX = new SwapProvider("okx", "OKX", false, false, "0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f", AppInfos.ETHEREUM);
}
export class EarnProvider extends BaseProvider {
    static KILN = new EarnProvider("kiln_pooling", "Kiln staking Pool");
    static STADER_LABS = new EarnProvider("stader-eth", "Stader Labs");
    static LIDO = new EarnProvider("lido", "Lido");
}
export class BuySellProvider extends BaseProvider {
    isTested;
    constructor(name, uiName, isTested) {
        super(name, uiName);
        this.isTested = isTested;
    }
    static MOONPAY = new BuySellProvider("moonpay", "MoonPay", true);
    static REVOLUT = new BuySellProvider("revolut", "Revolut", true);
    static MERCURYO = new BuySellProvider("mercuryo", "Mercuryo", true);
    static TRANSAK = new BuySellProvider("transak", "Transak", true);
    static TOPPER = new BuySellProvider("topper", "Topper", true);
    static COINBASE = new BuySellProvider("coinbase", "Coinbase", true);
    static COINIFY = new BuySellProvider("coinify-buy", "Coinify", true);
    static RAMP_NETWORK = new BuySellProvider("ramp", "Ramp Network", true);
    static BTC_DIRECT = new BuySellProvider("btc_direct", "BTC Direct", true);
    static SARDINE = new BuySellProvider("sardine", "Sardine", true);
    static SIMPLEX = new BuySellProvider("simplex", "Simplex", true);
    static BANXA = new BuySellProvider("banxa", "Banxa", true);
    static YOU_HODLER = new BuySellProvider("youhodler", "YouHodler", true);
    static ALCHEMY_PAY = new BuySellProvider("alchemypay", "Alchemy Pay", true);
    static CRYPTO_COM = new BuySellProvider("cryptocom", "Crypto.com", true);
    static PAYPAL = new BuySellProvider("paypal", "PayPal", false);
}
export var Rate;
(function (Rate) {
    Rate["FIXED"] = "fixed";
    Rate["FLOAT"] = "float";
})(Rate || (Rate = {}));
//# sourceMappingURL=Provider.js.map