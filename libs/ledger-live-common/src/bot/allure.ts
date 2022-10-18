import { SpecReport } from "./types";
import { AllureRuntime, Status } from "allure-js-commons";

export function createAllureReport({
  folder,
  results,
  environment,
}: {
  folder: string;
  results: Array<SpecReport<any>>;
  environment: string | undefined;
}): void {
  const allureRuntime = new AllureRuntime({ resultsDir: folder });
  const group = allureRuntime.startGroup("Bot " + environment);
  results.forEach((r) => {
    const allureTest = group.startTest("Spec " + r.spec.name);
    // Scan accounts is the initial phase of the bot, if a fatalError happened, it's failed.
    const scanStep = allureTest.startStep("Scan Accounts");
    scanStep.endStep();
    scanStep.status = r.fatalError ? Status.FAILED : Status.PASSED;
    if (r.fatalError) {
      scanStep.statusDetails = {
        message: r.fatalError.message,
        trace: r.fatalError.stack,
      };
    }
    // after this, we reach mutations steps
    r.mutations?.forEach(({ mutation, error }) => {
      if (!mutation) {
        return;
      }
      const step = allureTest.startStep("Mutation " + mutation.name);
      step.endStep();
      step.status = error ? Status.FAILED : Status.PASSED;
    });
    allureTest.endTest();
    // We set the status to error if any error happened
    const anyError = r.fatalError || r.mutations?.find((r) => r.error);
    allureTest.status = anyError ? Status.FAILED : Status.PASSED;
  });
  group.endGroup();
}
