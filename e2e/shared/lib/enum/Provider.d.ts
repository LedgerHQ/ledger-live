import { AppInfos } from "./AppInfos";
export declare abstract class BaseProvider {
    readonly name: string;
    readonly uiName: string;
    constructor(name: string, uiName: string);
    static getByUiName<T extends BaseProvider>(this: abstract new (...args: never[]) => T, uiName: string): T | undefined;
    static getNameByUiName<T extends BaseProvider>(this: (abstract new (...args: never[]) => T) & {
        getByUiName(uiName: string): T | undefined;
    }, uiName: string): string;
}
export declare class SwapProvider extends BaseProvider {
    readonly kyc: boolean;
    readonly availableOnLns: boolean;
    readonly contractAddress?: string | undefined;
    readonly app?: AppInfos | undefined;
    constructor(name: string, uiName: string, kyc: boolean, availableOnLns: boolean, contractAddress?: string | undefined, app?: AppInfos | undefined);
    static readonly EXODUS: SwapProvider;
    static readonly MOONPAY: SwapProvider;
    static readonly CIC: SwapProvider;
    static readonly NEAR_INTENTS: SwapProvider;
    static readonly SWAPSXYZ: SwapProvider;
    static readonly MOONPAY_TRADE: SwapProvider;
    static readonly THORCHAIN: SwapProvider;
    static readonly LIFI: SwapProvider;
    static readonly UNISWAP: SwapProvider;
    static readonly ONE_INCH: SwapProvider;
    static readonly VELORA: SwapProvider;
    static readonly OKX: SwapProvider;
}
export declare class EarnProvider extends BaseProvider {
    static readonly KILN: EarnProvider;
    static readonly STADER_LABS: EarnProvider;
    static readonly LIDO: EarnProvider;
}
export declare class BuySellProvider extends BaseProvider {
    readonly isTested: boolean;
    constructor(name: string, uiName: string, isTested: boolean);
    static readonly MOONPAY: BuySellProvider;
    static readonly REVOLUT: BuySellProvider;
    static readonly MERCURYO: BuySellProvider;
    static readonly TRANSAK: BuySellProvider;
    static readonly TOPPER: BuySellProvider;
    static readonly COINBASE: BuySellProvider;
    static readonly COINIFY: BuySellProvider;
    static readonly RAMP_NETWORK: BuySellProvider;
    static readonly BTC_DIRECT: BuySellProvider;
    static readonly SARDINE: BuySellProvider;
    static readonly SIMPLEX: BuySellProvider;
    static readonly BANXA: BuySellProvider;
    static readonly YOU_HODLER: BuySellProvider;
    static readonly ALCHEMY_PAY: BuySellProvider;
    static readonly CRYPTO_COM: BuySellProvider;
    static readonly PAYPAL: BuySellProvider;
}
export declare enum Rate {
    FIXED = "fixed",
    FLOAT = "float"
}
//# sourceMappingURL=Provider.d.ts.map