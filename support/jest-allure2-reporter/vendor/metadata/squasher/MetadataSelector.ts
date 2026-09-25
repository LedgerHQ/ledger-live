import type { AllureTestItemMetadata, AllureTestStepMetadata } from '@support/jest-allure2-reporter';

import { weakMemoize } from '../../utils';

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

export class MetadataSelector<Metadata, T extends AllureTestItemMetadata> {
  constructor(protected readonly _options: MetadataSelectorOptions<Metadata, T>) {
    this.belowTestInvocation = weakMemoize(this.belowTestInvocation.bind(this));
    this.testInvocationAndBelow = weakMemoize(this.testInvocationAndBelow.bind(this));
    this.testInvocationAndBelowDirect = weakMemoize(this.testInvocationAndBelowDirect.bind(this));
    this.testDefinitionAndBelow = weakMemoize(this.testDefinitionAndBelow.bind(this));
  }

  protected readonly _getDocblock = (metadata: Metadata | undefined): T | undefined =>
    metadata ? this._options.getDocblock(metadata) : undefined;

  protected readonly _getMetadataUnsafe = (metadata: Metadata | undefined): T | undefined =>
    metadata ? this._options.getMetadata(metadata) : undefined;

  readonly getMetadataWithDocblock = (metadata: Metadata | undefined): T =>
    this._options.mergeUnsafe(
      this._options.mergeUnsafe(this._options.empty(), this._getDocblock(metadata)),
      this._getMetadataUnsafe(metadata),
    );

  protected _describeAncestors = weakMemoize(
    (metadata: LikeDescribeBlock<Metadata> | undefined): T =>
      metadata
        ? this._options.mergeUnsafe(
            this._describeAncestors(metadata.parent),
            this._getMetadataUnsafe(metadata),
          )
        : this._options.empty(),
  );

  protected _ancestors(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(
      this.globalAndTestFile(metadata.file),
      this._describeAncestors(metadata.definition.describeBlock),
    );
  }

  protected _hookMetadata = (metadata: LikeStepInvocation<Metadata>): T => {
    const definitionMetadata = this.getMetadataWithDocblock(metadata.definition);
    return this.merge(definitionMetadata, this._getMetadataUnsafe(metadata));
  };

  public readonly merge = (a: T | undefined, b: T | undefined): T =>
    this._options.mergeUnsafe(this._options.mergeUnsafe(this._options.empty(), a), b);

  testInvocation(metadata: Metadata): T {
    return this.getMetadataWithDocblock(metadata);
  }

  testDefinition(metadata: LikeTestInvocation<Metadata>): T {
    return this.getMetadataWithDocblock(metadata.definition);
  }

  belowTestInvocation(metadata: LikeTestInvocation<Metadata>): T {
    return [...metadata.allInvocations()]
      .map(this._getMetadataUnsafe)
      .reduce(this._options.mergeUnsafe, this._options.empty());
  }

  testInvocationAndBelow(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(this.testInvocation(metadata), this.belowTestInvocation(metadata));
  }

  testInvocationAndBelowDirect(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(this.testInvocation(metadata), this.getMetadataWithDocblock(metadata.fn));
  }

  testDefinitionAndBelow(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(this.testDefinition(metadata), this.testInvocationAndBelow(metadata));
  }

  testDefinitionAndBelowDirect(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(this.testDefinition(metadata), this.testInvocationAndBelowDirect(metadata));
  }

  testVertical(metadata: LikeTestInvocation<Metadata>): T {
    const ancestors = this._ancestors(metadata);
    const test_definition_and_below = this.testDefinitionAndBelow(metadata);
    return this.merge(ancestors, test_definition_and_below);
  }

  steps(metadata: LikeTestInvocation<Metadata>): AllureTestStepMetadata[] {
    const before = [...metadata.beforeAll, ...metadata.beforeEach].map(this._hookMetadata);

    const after = [...metadata.afterEach, ...metadata.afterAll].map(this._hookMetadata);

    const testFunctionSteps =
      (metadata.fn && this.getMetadataWithDocblock(metadata.fn).steps) || [];

    return [...before, ...testFunctionSteps, ...after];
  }

  globalAndTestFile(metadata: LikeTestFile<Metadata>): T {
    return this.merge(
      this._getMetadataUnsafe(metadata.globalMetadata),
      this.getMetadataWithDocblock(metadata),
    );
  }

  globalAndTestFileAndTestInvocation(metadata: LikeTestInvocation<Metadata>): T {
    return this.merge(this.globalAndTestFile(metadata.file), this._getMetadataUnsafe(metadata));
  }
}
