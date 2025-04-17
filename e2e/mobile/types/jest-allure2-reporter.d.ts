// jest-allure2-reporter-api.d.ts
declare module "jest-allure2-reporter/api" {
  export function $TmsLink(tmsLink: string): void;

  export function $Severity(severity: string): void;

  export function $Epic(epic: string): void;

  export function $Feature(feature: string): void;

  export function Step(name: string): MethodDecorator;

  export const allure: {
    description(description: string): void;
    attachment(name: string, content: string, type: string): Promise<void>;
  };
}

declare global {
  function $TmsLink(tmsLink: string): void;

  function $Severity(severity: string): void;

  function $Epic(epic: string): void;

  function $Feature(feature: string): void;

  function Step(name: string): MethodDecorator;
}

export {};
