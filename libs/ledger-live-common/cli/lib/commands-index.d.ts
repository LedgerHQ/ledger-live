/// <reference types="node" />
declare const _default: {
    app: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
            multiple: boolean;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            alias?: undefined;
            multiple?: undefined;
        })[];
        job: ({ device, verbose, install, uninstall, open, quit, debug, }: Partial<{
            device: string;
            verbose: boolean;
            install: string[];
            uninstall: string[];
            open: string;
            quit: string;
            debug: string;
        }>) => import("rxjs").Observable<any>;
    };
    appUninstallAll: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<import("../../lib/apps").State>;
    };
    appsCheckAllAppVersions: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            desc: string;
        })[];
        job: ({ device, memo, }: Partial<{
            device: string;
            memo: string;
        }>) => import("rxjs").Observable<never>;
    };
    appsInstallAll: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<import("../../lib/apps").State>;
    };
    appsUpdateTestAll: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            type: NumberConstructor;
        })[];
        job: ({ device, index, }: Partial<{
            device: string;
            index: number;
        }>) => import("rxjs").Observable<import("rxjs").Observable<unknown>>;
    };
    balanceHistory: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            format: string;
            period: string;
        }) => import("rxjs").Observable<any>;
    };
    bot: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        }[];
        job: (arg: any) => import("rxjs").Observable<void>;
    };
    botPortfolio: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        }[];
        job: (opts: {
            format: string;
        }) => import("rxjs").Observable<any>;
    };
    botTransfer: {
        description: string;
        args: never[];
        job: () => import("rxjs").Observable<void>;
    };
    broadcast: {
        description: string;
        args: ({
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
        job: (opts: Partial<{
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
        }> & Partial<{
            "signed-operation": string;
        }>) => import("rxjs").Observable<string>;
    };
    cleanSpeculos: {
        description: string;
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    countervalues: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            multiple: boolean;
            desc: string;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
            multiple?: undefined;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
            multiple?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            multiple?: undefined;
            desc?: undefined;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            alias?: undefined;
            multiple?: undefined;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: NumberConstructor;
            desc: string;
            multiple?: undefined;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
            multiple?: undefined;
            typeDesc?: undefined;
            desk?: undefined;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desk: string;
            multiple?: undefined;
            desc?: undefined;
            typeDesc?: undefined;
        })[];
        job: (opts: Partial<{
            currency: string[];
            countervalue: string[];
            fiats: boolean;
            format: string;
            period: string;
            verbose: boolean;
            marketcap: number;
            disableAutofillGaps: boolean;
            latest: boolean;
            startDate: string;
        }>) => any;
    };
    derivation: {
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    devDeviceAppsScenario: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        })[];
        job: ({ device, scenario, }: Partial<{
            device: string;
            scenario: string;
        }>) => import("rxjs").Observable<unknown>;
    };
    deviceAppVersion: {
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<{
            name: string;
            version: string;
            flags: number | Buffer;
        }>;
    };
    deviceInfo: {
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<import("../../lib/types/manager").DeviceInfo>;
    };
    deviceVersion: {
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<import("../../lib/types/manager").FirmwareInfo>;
    };
    discoverDevices: {
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: ({ module, interactive, }: Partial<{
            module: string;
            interactive: boolean;
        }>) => import("rxjs").Observable<{
            type: "add" | "remove";
            id: string;
            name: string;
        }> | import("rxjs").Observable<string>;
    };
    envs: {
        description: string;
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    estimateMaxSpendable: {
        description: string;
        args: ({
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
        job: (opts: Partial<{
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
        }>) => import("rxjs").Observable<string>;
    };
    exportAccounts: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            out: boolean;
        }>) => import("rxjs").Observable<unknown>;
    };
    firmwareRepair: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
        })[];
        job: ({ device, forceMCU, }: Partial<{
            device: string;
            forceMCU: string;
        }>) => import("rxjs").Observable<{
            progress: number;
        }>;
    };
    firmwareUpdate: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
        })[];
        job: ({ device, osuVersion, "to-my-own-risk": toMyOwnRisk, listOSUs, }: Partial<{
            device: string;
            osuVersion: string;
            "to-my-own-risk": boolean;
            listOSUs: boolean;
        }>) => import("rxjs").Observable<unknown>;
    };
    generateAppJsonFromDataset: {
        description: string;
        args: never[];
        job: () => Promise<void>;
    };
    generateTestScanAccounts: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            format: string;
        }) => import("rxjs").Observable<string>;
    };
    generateTestTransaction: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
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
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple: boolean;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple?: undefined;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            "self-transaction": boolean;
            "use-all-amount": boolean;
            recipient: string[];
            amount: string;
            shuffle: boolean;
            "fees-strategy": string;
            collection: string;
            tokenIds: string;
            quantities: string;
        }>) => import("rxjs").Observable<string>;
    };
    genuineCheck: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        }[];
        job: ({ device, }: Partial<{
            device: string;
        }>) => import("rxjs").Observable<import("../../lib/types/manager").SocketEvent>;
    };
    getAddress: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            alias?: undefined;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (arg: Partial<{
            currency: string;
            device: string;
            path: string;
            derivationMode: string;
            verify: boolean;
        }>) => import("rxjs").Observable<import("../../lib/hw/getAddress/types").Result>;
    };
    getTransactionStatus: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
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
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple: boolean;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            "self-transaction": boolean;
            "use-all-amount": boolean;
            recipient: string[];
            amount: string;
            shuffle: boolean;
            "fees-strategy": string;
            collection: string;
            tokenIds: string;
            quantities: string;
        }> & {
            format: string;
        }) => import("rxjs").Observable<any>;
    };
    liveData: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            appjson: string;
            add: boolean;
        }>) => import("rxjs").Observable<string>;
    };
    makeCompoundSummary: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            format: "default" | "summary";
        }) => import("rxjs").Observable<string>;
    };
    managerListApps: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
        })[];
        job: ({ device, format, }: Partial<{
            device: string;
            format: string;
        }>) => import("rxjs").Observable<any>;
    };
    portfolio: {
        description: string;
        args: ({
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
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            alias?: undefined;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (opts: Partial<Partial<{
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
        }> & {
            disableAutofillGaps: boolean;
            countervalue: string;
            period: string;
        }>) => import("rxjs").Observable<string>;
    };
    proxy: {
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            alias?: undefined;
        })[];
        job: ({ device, file, record, port, silent, verbose, "disable-auto-skip": noAutoSkip, }: {
            device: any;
            file: any;
            record: any;
            port: any;
            silent: any;
            verbose: any;
            "disable-auto-skip": any;
        }) => import("rxjs").Observable<unknown>;
    };
    receive: {
        description: string;
        args: ({
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
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            qr: boolean;
            freshAddressIndex: number | null | undefined;
        }) => import("rxjs").Observable<string>;
    };
    repl: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: ({ device, file }: {
            device: string;
            file: string;
        }) => import("rxjs").Observable<string>;
    };
    satstack: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            typeDesc?: undefined;
        } | {
            name: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            typeDesc?: undefined;
        })[];
        job: ({ "no-device": noDevice, "no-save": noSave, device, lss, rpcHOST, rpcUSER, rpcPASSWORD, rpcTLS, }: {
            "no-device": boolean;
            "no-save": boolean;
            device: string;
            lss: string;
            rpcHOST: string;
            rpcUSER: string;
            rpcPASSWORD: string;
            rpcTLS: boolean;
        }) => import("rxjs").Observable<string>;
    };
    satstackStatus: {
        description: string;
        args: {
            name: string;
            type: BooleanConstructor;
            desc: string;
        }[];
        job: ({ continuous }: {
            continuous?: boolean | undefined;
        }) => import("rxjs").Observable<import("../../lib/families/bitcoin/satstack").SatStackStatus>;
    };
    scanDescriptors: {
        description: string;
        args: {
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        }[];
        job: (opts: Partial<{
            device: string;
            currency: string;
        }>) => import("rxjs").Observable<import("../../lib/families/bitcoin/descriptor").AccountDescriptor>;
    };
    send: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
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
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            multiple?: undefined;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple: boolean;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            multiple?: undefined;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            "self-transaction": boolean;
            "use-all-amount": boolean;
            recipient: string[];
            amount: string;
            shuffle: boolean;
            "fees-strategy": string;
            collection: string;
            tokenIds: string;
            quantities: string;
        }> & {
            "ignore-errors": boolean;
            "disable-broadcast": boolean;
            format: string;
        }) => import("rxjs").Observable<string>;
    };
    signMessage: {
        description: string;
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            desc: string;
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
        })[];
        job: (arg: any) => import("rxjs").Observable<import("../../lib/hw/signMessage/types").Result>;
    };
    speculosList: {
        description: string;
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    swap: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            amount: string;
            useAllAmount: boolean;
            useFloat: boolean;
            wyreUserId?: string | undefined;
            _unknown: any;
            deviceId: string;
            tokenId: string;
        }) => import("rxjs").Observable<void>;
    };
    sync: {
        description: string;
        args: ({
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
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
            typeDesc: string;
            desc: string;
        })[];
        job: (opts: Partial<{
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
        }> & {
            format: string;
        }) => import("rxjs").Observable<any>;
    };
    testDetectOpCollision: {
        description: string;
        args: ({
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
        job: (opts: Partial<{
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
        }>) => import("rxjs").Observable<import("../../lib/types").Operation[]>;
    };
    testGetTrustedInputFromTxHash: {
        args: ({
            name: string;
            alias: string;
            type: StringConstructor;
            descOpt: string;
            desc: string;
        } | {
            name: string;
            alias: string;
            type: StringConstructor;
        })[];
        job: ({ device, currency, hash, }: Partial<{
            device: string;
            currency: string;
            hash: string;
        }>) => import("rxjs").Observable<"Backend returned no hex for this hash" | {
            inHash: any;
            finalOut: string;
        }>;
    };
    user: {
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    version: {
        args: never[];
        job: () => import("rxjs").Observable<string>;
    };
    walletconnect: {
        description: string;
        args: ({
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
        } | {
            name: string;
            type: StringConstructor;
            desc: string;
            alias?: undefined;
        } | {
            name: string;
            alias: string;
            type: BooleanConstructor;
            desc: string;
        } | {
            name: string;
            type: BooleanConstructor;
            desc: string;
            alias?: undefined;
        })[];
        job: (opts: Partial<{
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
        }> & Partial<{
            walletConnectURI: string;
            walletConnectSession: string;
            verbose: boolean;
            silent: boolean;
        }>) => any;
    };
};
export default _default;
//# sourceMappingURL=commands-index.d.ts.map