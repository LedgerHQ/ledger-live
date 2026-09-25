import type { AllureTestCaseResult, AllureTestStepResult, Parameter } from '@support/jest-allure2-reporter';

export function normalizeParameters(result: AllureTestCaseResult | AllureTestStepResult) {
  return result.parameters?.filter(excludeParameters).map(stringifyParameter);
}

function excludeParameters({ excluded }: Parameter) {
  return !excluded;
}

function stringifyParameter(parameter: Parameter) {
  return { ...parameter, value: String(parameter.value) };
}
