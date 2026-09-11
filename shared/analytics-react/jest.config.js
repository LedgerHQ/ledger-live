const path = require("path");
const { createFlowJestConfig } = require("@support/jest-features-flow");

const swcTransform = {
  "^.+\\.(t|j)sx?$": [
    "@swc/jest",
    {
      jsc: {
        target: "esnext",
        parser: { syntax: "typescript", tsx: true },
        transform: { react: { runtime: "automatic" } },
      },
    },
  ],
};

const config = createFlowJestConfig({ forceExit: true });

for (const project of config.projects) {
  project.transform = swcTransform;
}

const nativeProject = config.projects.find(project => project.displayName === "native");
if (nativeProject) {
  nativeProject.setupFilesAfterEnv = [path.join(__dirname, "jest.setup.native.js")];
}

module.exports = config;
