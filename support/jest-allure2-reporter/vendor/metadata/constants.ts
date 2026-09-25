import type { AllureTestCaseMetadata } from '@support/jest-allure2-reporter';

export const PREFIX = 'allure2' as const;

type Path = readonly [typeof PREFIX, keyof AllureTestCaseMetadata];

export const CURRENT_STEP: Path = [PREFIX, 'currentStep'] as const;
export const DESCRIPTION = [PREFIX, 'description'] as const;
export const DESCRIPTION_HTML = [PREFIX, 'descriptionHtml'] as const;
export const DISPLAY_NAME: Path = [PREFIX, 'displayName'] as const;
export const DOCBLOCK: Path = [PREFIX, 'docblock'] as const;
export const FULL_NAME: Path = [PREFIX, 'fullName'] as const;
export const HISTORY_ID: Path = [PREFIX, 'historyId'] as const;
export const LABELS = [PREFIX, 'labels'] as const;
export const LINKS = [PREFIX, 'links'] as const;
export const PARAMETERS: Path = [PREFIX, 'parameters'] as const;
