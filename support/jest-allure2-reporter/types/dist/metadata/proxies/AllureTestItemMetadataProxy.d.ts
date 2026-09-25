import type { AllureTestItemMetadata, AllureTestStepMetadata, AllureTestCaseMetadata } from '@support/jest-allure2-reporter';
import type { Metadata } from 'jest-metadata';
import { AllureMetadataProxy } from './AllureMetadataProxy';
export declare class AllureTestItemMetadataProxy<T extends AllureTestItemMetadata = AllureTestStepMetadata & AllureTestCaseMetadata> extends AllureMetadataProxy<T> {
    protected readonly $boundPath?: string[];
    constructor(metadata: Metadata, boundPath?: string[]);
    get id(): string;
    $bind(step?: null): AllureTestItemMetadataProxy<T>;
    $startStep(): this;
    $stopStep(): this;
    protected $localPath(key?: keyof T, ...innerKeys: string[]): string[];
}
