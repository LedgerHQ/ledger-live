const { createFlowJestConfig } = require("@support/jest-features-flow");

const base = createFlowJestConfig();

module.exports = {
  ...base,
  projects: base.projects.map(project =>
    project.displayName === "native" ? { ...project, testEnvironment: "jsdom" } : project,
  ),
};
