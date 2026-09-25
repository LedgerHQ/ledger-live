import { AllureRealm } from './AllureRealm';

function getRealm() {
  return ((globalThis as any).__ALLURE__ as AllureRealm) ?? new AllureRealm();
}

export default getRealm();
