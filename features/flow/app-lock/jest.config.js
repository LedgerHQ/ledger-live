// Native-only: the shared config's jsdom project matches nothing and needs jest-environment-jsdom.
const { projects, ...config } = require("@support/jest-features-flow").createFlowJestConfig({
  passWithNoTests: true,
});

module.exports = {
  ...config,
  projects: projects.filter(project => project.displayName === "native"),
};
