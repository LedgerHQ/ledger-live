const { DetoxCircusEnvironment } = require("detox/runners/jest");
const AllureReporter = require("./reporters/AllureReporterCircus");

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    this.registerListeners({ AllureReporter });
  }
}

module.exports = CustomDetoxEnvironment;
