import { Observable } from "rxjs";
import type { Account, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
export declare const deviceOpt: {
    name: string;
    alias: string;
    type: StringConstructor;
    descOpt: string;
    desc: string;
};
export declare const currencyOpt: {
    name: string;
    alias: string;
    type: StringConstructor;
    desc: string;
};
export declare type ScanCommonOpts = Partial<{
    device: string;
    id: string[];
    xpub: string[];
    file: string;
    appjsonFile: string;
    currency: string;
    scheme: string;
    index: number;
    length: number;
    paginateOperations: number;
}>;
export declare const scanCommonOpts: ({
    name: string;
    alias: string;
    type: StringConstructor;
    desc: string;
} | {
    name: string;
    type: StringConstructor;
    desc: string;
    multiple: boolean;
    typeDesc?: undefined;
    alias?: undefined;
} | {
    name: string;
    type: StringConstructor;
    typeDesc: string;
    desc: string;
    multiple?: undefined;
    alias?: undefined;
} | {
    name: string;
    alias: string;
    type: NumberConstructor;
    desc: string;
    multiple?: undefined;
    typeDesc?: undefined;
} | {
    name: string;
    type: NumberConstructor;
    desc: string;
    multiple?: undefined;
    typeDesc?: undefined;
    alias?: undefined;
})[];
export declare const inferManagerApp: (keyword: string) => string;
export declare const inferCurrency: <T extends {
    device: string;
    currency: string;
    file: string;
    xpub: string[];
    id: string[];
}>({ device, currency, file, xpub, id, }: Partial<T>) => Observable<CryptoCurrency | null | undefined>;
export declare function scan(arg: ScanCommonOpts): Observable<Account>;
//# sourceMappingURL=scan.d.ts.map