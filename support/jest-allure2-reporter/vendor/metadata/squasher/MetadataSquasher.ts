import type { Metadata, TestFileMetadata, TestInvocationMetadata } from 'jest-metadata';
import type {
  AllureTestItemDocblock,
  AllureNestedTestStepMetadata,
  AllureTestCaseMetadata,
  AllureTestFileMetadata,
} from '@support/jest-allure2-reporter';

import { DOCBLOCK, PREFIX } from '../constants';
import * as docblock from '../docblockMapping';

import { MetadataSelector } from './MetadataSelector';
import { mergeTestCaseMetadata, mergeTestFileMetadata, mergeTestStepMetadata } from './mergers';

export class MetadataSquasher {
  protected readonly _fileSelector: MetadataSelector<Metadata, AllureTestFileMetadata>;

  protected readonly _testSelector: MetadataSelector<Metadata, AllureTestCaseMetadata>;

  protected readonly _stepSelector: MetadataSelector<Metadata, AllureNestedTestStepMetadata>;

  constructor() {
    this._fileSelector = new MetadataSelector({
      empty: () => ({}),
      getDocblock: (metadata) =>
        docblock.mapTestFileDocblock(metadata.get<AllureTestItemDocblock>(DOCBLOCK, {})),
      getMetadata: (metadata) => metadata.get<AllureTestFileMetadata>(PREFIX),
      mergeUnsafe: mergeTestFileMetadata,
    });

    this._testSelector = new MetadataSelector({
      empty: () => ({}),
      getDocblock: (metadata) =>
        docblock.mapTestCaseDocblock(metadata.get<AllureTestItemDocblock>(DOCBLOCK, {})),
      getMetadata: (metadata) => metadata.get<AllureTestCaseMetadata>(PREFIX),
      mergeUnsafe: mergeTestCaseMetadata,
    });

    this._stepSelector = new MetadataSelector({
      empty: () => ({}),
      getDocblock: (metadata) =>
        docblock.mapTestStepDocblock(metadata.get<AllureTestItemDocblock>(DOCBLOCK, {})),
      getMetadata: (metadata) => metadata.get<AllureNestedTestStepMetadata>(PREFIX),
      mergeUnsafe: mergeTestStepMetadata,
    });
  }

  testFile(jest_metadata: TestFileMetadata): AllureTestFileMetadata {
    const result = {
      ...this._fileSelector.globalAndTestFile(jest_metadata),
      steps: this._stepSelector.getMetadataWithDocblock(jest_metadata).steps,
    };

    return result;
  }

  testInvocation(invocation: TestInvocationMetadata): AllureTestCaseMetadata {
    const test_vertical = this._testSelector.testVertical(invocation);
    const test_definition_and_below = this._testSelector.testDefinitionAndBelow(invocation);
    const test_definition_and_below_direct =
      this._testSelector.testDefinitionAndBelowDirect(invocation);
    const test_invocation_and_below = this._testSelector.testInvocationAndBelow(invocation);

    const result: AllureTestCaseMetadata = {
      attachments: test_definition_and_below_direct.attachments,
      description: test_vertical.description,
      descriptionHtml: test_vertical.descriptionHtml,
      displayName: test_definition_and_below_direct.displayName,
      fullName: test_definition_and_below.fullName,
      historyId: test_definition_and_below.historyId,
      labels: test_vertical.labels,
      links: test_vertical.links,
      parameters: test_definition_and_below_direct.parameters,
      sourceLocation: test_definition_and_below_direct.sourceLocation,
      stage: test_invocation_and_below.stage,
      start: test_invocation_and_below.start,
      status: test_invocation_and_below.status,
      statusDetails: test_invocation_and_below.statusDetails,
      steps: this._stepSelector.steps(invocation),
      stop: test_invocation_and_below.stop,
      transformedCode: test_definition_and_below_direct.transformedCode,
    };

    return result;
  }
}
