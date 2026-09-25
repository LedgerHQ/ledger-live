import { bunyamin, type BunyaminLogRecordFields, isDebug, threadGroups } from 'bunyamin';

export const log = bunyamin.child({
  cat: '@support/jest-allure2-reporter',
  tid: '@support/jest-allure2-reporter',
});

const nofields: BunyaminLogRecordFields = {};
const noop = () => nofields;

export const optimizeForTracing = isDebug('@support/jest-allure2-reporter')
  ? <T extends (...arguments_: any[]) => BunyaminLogRecordFields>(function_: T): T => function_
  : () => noop;

threadGroups.add({
  id: '@support/jest-allure2-reporter',
  displayName: '@support/jest-allure2-reporter',
});
