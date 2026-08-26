const path = require("path");

const config = require("@support/jest-features-flow").createFlowJestConfig();

const webProject = config.projects.find(project => project.displayName === "web");
webProject.setupFilesAfterEnv = [
  ...webProject.setupFilesAfterEnv,
  path.join(__dirname, "jest.setup.text-encoding.js"),
];

module.exports = config;
