module.exports = {
  ...require("../../../e2e/mobile/detox.config"),
  artifacts: {
    plugins: {
      video: {
        enabled: true,
        recordingResolution: "720x1280",
        keepOnlyFailedTestsArtifacts: true,
      },
    },
  },
};
