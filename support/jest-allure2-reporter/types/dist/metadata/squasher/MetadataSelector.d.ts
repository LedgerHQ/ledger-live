import type { AllureTestItemMetadata, AllureTestStepMetadata } from '@support/jest-allure2-reporter';
export type MetadataSelectorOptions<Metadata, Result> = {
    empty(): Result;
    getMetadata(metadata: Metadata): Result | undefined;
    getDocblock(metadata: Metadata): Result | undefined;
    mergeUnsafe(a: Result, b: Result | undefined): Result;
};
export interface HasParent<Metadata> {
    readonly parent?: LikeDescribeBlock<Metadata>;
}
export type LikeDescribeBlock<Metadata> = Metadata & HasParent<Metadata>;
export type LikeTestDefinition<Metadata> = Metadata & {
    readonly describeBlock: LikeDescribeBlock<Metadata>;
};
export type LikeStepInvocation<Metadata> = Metadata & {
    readonly definition: Metadata;
};
export type LikeTestFile<Metadata> = Metadata & {
    readonly globalMetadata: Metadata;
};
export type LikeTestInvocation<Metadata> = Metadata & {
    allInvocations(): Iterable<Metadata>;
    readonly file: LikeTestFile<Metadata>;
    readonly beforeAll: Iterable<LikeStepInvocation<Metadata>>;
    readonly beforeEach: Iterable<LikeStepInvocation<Metadata>>;
    readonly afterEach: Iterable<LikeStepInvocation<Metadata>>;
    readonly afterAll: Iterable<LikeStepInvocation<Metadata>>;
    readonly definition: LikeTestDefinition<Metadata>;
    readonly fn?: Metadata;
};
export declare class MetadataSelector<Metadata, T extends AllureTestItemMetadata> {
    protected readonly _options: MetadataSelectorOptions<Metadata, T>;
    constructor(_options: MetadataSelectorOptions<Metadata, T>);
    protected readonly _getDocblock: (metadata: Metadata | undefined) => T | undefined;
    protected readonly _getMetadataUnsafe: (metadata: Metadata | undefined) => T | undefined;
    readonly getMetadataWithDocblock: (metadata: Metadata | undefined) => T;
    protected _describeAncestors: (metadata: LikeDescribeBlock<Metadata> | undefined) => T;
    protected _ancestors(metadata: LikeTestInvocation<Metadata>): T;
    protected _hookMetadata: (metadata: LikeStepInvocation<Metadata>) => T;
    readonly merge: (a: T | undefined, b: T | undefined) => T;
    testInvocation(metadata: Metadata): T;
    testDefinition(metadata: LikeTestInvocation<Metadata>): T;
    belowTestInvocation(metadata: LikeTestInvocation<Metadata>): T;
    testInvocationAndBelow(metadata: LikeTestInvocation<Metadata>): T;
    testInvocationAndBelowDirect(metadata: LikeTestInvocation<Metadata>): T;
    testDefinitionAndBelow(metadata: LikeTestInvocation<Metadata>): T;
    testDefinitionAndBelowDirect(metadata: LikeTestInvocation<Metadata>): T;
    testVertical(metadata: LikeTestInvocation<Metadata>): T;
    steps(metadata: LikeTestInvocation<Metadata>): AllureTestStepMetadata[];
    globalAndTestFile(metadata: LikeTestFile<Metadata>): T;
    globalAndTestFileAndTestInvocation(metadata: LikeTestInvocation<Metadata>): T;
}
