import type {
  PropertyExtractor,
  TestCaseCustomizer,
  TestCaseExtractorContext,
} from '@support/jest-allure2-reporter';

import * as extractors from '../common';
import * as custom from '../custom';
import type { TestCaseCompositeExtractor, TestCaseExtractor } from '../types';

import { parameters } from './parameters';

const fallback: PropertyExtractor<{}, unknown> = (context) => context.value;

export function testCase<Context>(
  customizer: TestCaseCustomizer<Context>,
): TestCaseExtractor<Context>;
export function testCase(customizer: null | undefined): undefined;
export function testCase<Context>(
  customizer: TestCaseCustomizer<Context> | null | undefined,
): TestCaseExtractor<Context> | undefined;
export function testCase<Context extends TestCaseExtractorContext>(
  customizer: TestCaseCustomizer<Context> | null | undefined,
): TestCaseExtractor<Context> | undefined {
  if (customizer == null) {
    return;
  }

  return extractors.composite({
    uuid: extractors.constant(customizer.uuid) ?? fallback,
    ignored: extractors.constant(customizer.ignored) ?? fallback,
    historyId: extractors.constant(customizer.historyId) ?? fallback,
    displayName: extractors.constant(customizer.displayName) ?? fallback,
    fullName: extractors.constant(customizer.fullName) ?? fallback,
    start: extractors.constant(customizer.start) ?? fallback,
    stop: extractors.constant(customizer.stop) ?? fallback,
    description: extractors.constant(customizer.description) ?? fallback,
    descriptionHtml: extractors.constant(customizer.descriptionHtml) ?? fallback,
    stage: extractors.constant(customizer.stage) ?? fallback,
    status: extractors.constant(customizer.status) ?? fallback,
    statusDetails: extractors.merger(customizer.statusDetails) ?? fallback,
    attachments: extractors.appender(customizer.attachments) ?? fallback,
    parameters: parameters(customizer.parameters) ?? fallback,
    labels: custom.labels(customizer.labels) ?? fallback,
    links: custom.links(customizer.links) ?? fallback,
    steps: null,
  } as TestCaseCompositeExtractor<Context>);
}
