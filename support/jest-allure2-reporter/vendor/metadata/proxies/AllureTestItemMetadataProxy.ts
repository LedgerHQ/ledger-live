import type {
  AllureTestItemMetadata,
  AllureTestStepMetadata,
  AllureTestCaseMetadata,
} from '@support/jest-allure2-reporter';
import type { Metadata } from 'jest-metadata';

import { CURRENT_STEP, PREFIX } from '../constants';

import { AllureMetadataProxy } from './AllureMetadataProxy';

export class AllureTestItemMetadataProxy<
  T extends AllureTestItemMetadata = AllureTestStepMetadata & AllureTestCaseMetadata,
> extends AllureMetadataProxy<T> {
  protected readonly $boundPath?: string[];

  constructor(metadata: Metadata, boundPath?: string[]) {
    super(metadata);
    this.$boundPath = boundPath;
  }

  get id(): string {
    const localPath = this.$localPath().join('.');
    return localPath ? `${this.$metadata.id}:${localPath}` : this.$metadata.id;
  }

  $bind(step?: null): AllureTestItemMetadataProxy<T> {
    return new AllureTestItemMetadataProxy(
      this.$metadata,
      step === null ? [] : [...this.$metadata.get(CURRENT_STEP, [])],
    );
  }

  $startStep(): this {
    const count = this.get('steps', []).length;
    this.push('steps', [{}]);
    this.$metadata.push(CURRENT_STEP, ['steps', `${count}`]);
    return this;
  }

  $stopStep(): this {
    const currentStep = this.$metadata.get(CURRENT_STEP, [] as string[]);
    this.$metadata.set(CURRENT_STEP, currentStep.slice(0, -2));
    return this;
  }

  protected $localPath(key?: keyof T, ...innerKeys: string[]): string[] {
    const stepPath = this.$boundPath ?? this.$metadata.get(CURRENT_STEP, []);
    const allKeys = key ? [key as string, ...innerKeys] : innerKeys;
    return [PREFIX, ...stepPath, ...allKeys];
  }
}
