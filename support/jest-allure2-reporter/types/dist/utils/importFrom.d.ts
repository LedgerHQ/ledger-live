export declare function importFrom(module: string, lookup: string | string[]): Promise<{
    filename: string;
    dirname: string;
    exports: any;
}>;
