const Allure = require('allure-js-commons'); // version "1.3.2",
const fs = require('fs');
const stripAnsi = require('strip-ansi');

class AllureReporterCircus {

  constructor({ detox }) {
    this.allure = new Allure();
    this.detox = detox;
  }

  run_describe_start(event) {
    if (event.describeBlock.parent !== undefined) {
      this.allure.startSuite(event.describeBlock.name);
    }
  }

  run_describe_finish(event) {
    if (event.describeBlock.parent !== undefined) {
      this.allure.endSuite();
    }
  }

  test_start(event) {
    const { test } = event;
    this.allure.startCase(test.name)
  }

  async test_done(event) {
    if (event.test.errors.length > 0) {
      const { test } = event;
      const screenshotPath = await this.detox.device.takeScreenshot(`${test.startedAt}-failed`);
      const buffer = fs.readFileSync(`${screenshotPath}`);
      this.allure.addAttachment('Screenshot test failue', Buffer.from(buffer, 'base64'), 'image/png');

      const err = test.errors[0][0];
      err.message = stripAnsi(err.message);
      err.stack = stripAnsi(err.stack);

      this.allure.endCase('failed', err);
    }
    else {
      this.allure.endCase('passed')
    }
  }

  test_skip(event) {
    const { test } = event;
    this.allure.startCase(test.name);
    this.allure.pendingCase(test.name);
  }
}

module.exports = AllureReporterCircus;