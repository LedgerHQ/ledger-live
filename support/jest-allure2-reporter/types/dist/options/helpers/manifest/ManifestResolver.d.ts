import type { ManifestHelper } from '@support/jest-allure2-reporter';
export type ImportModuleFunction = (path: string) => Record<string, any> | Promise<Record<string, any>>;
export declare class ManifestResolver {
    private readonly cwd;
    private readonly importFn;
    constructor(cwd: string, importFunction: ImportModuleFunction);
    extract: ManifestHelper;
    private resolveManifestPath;
    private resolveCJS;
}
