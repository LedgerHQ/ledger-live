import { createNodeMiddleware, createProbot, ProbotOctokit } from "probot";
import { retry } from "@octokit/plugin-retry";
import app from "../../../src/index";

const myOctokit = ProbotOctokit.plugin(retry).defaults({
  request: { retries: 3 },
});

export default createNodeMiddleware(app, {
  probot: createProbot({
    overrides: {
      logLevel: "info",
    },
    defaults: {
      Octokit: myOctokit,
    },
  }),
  webhooksPath: "/api/github/webhooks",
});
