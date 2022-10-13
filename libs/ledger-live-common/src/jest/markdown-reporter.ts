import fs from "fs";

function toPercent(n: number): number {
  return Math.round(n * 1000) / 10;
}

export default class DocumentTestHooksReporter {
  onRunComplete(test, runResults): void {
    const numFailedTests = runResults.numFailedTests;
    const numPassedTests = runResults.numPassedTests;
    const numTotalTests = numFailedTests + numPassedTests;
    const percentFailedTests = toPercent(numFailedTests / numTotalTests);
    const percentPassedTests = toPercent(numPassedTests / numTotalTests);

    const output = `# Jest Test Results
| Tests  |   # |    % |
| ------ | --: | ---: |
| Passed | ${numPassedTests} | ${percentPassedTests}% |
| Failed | ${numFailedTests} | ${percentFailedTests}% |
| Total  | ${numTotalTests} | 100% |`;

    fs.writeFileSync("./jest.result.md", output);
  }
}
