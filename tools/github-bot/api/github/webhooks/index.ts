import { createNodeMiddleware, createProbot, ProbotOctokit } from "probot";
import { retry } from "@octokit/plugin-retry";
import app from "../../../src/index";

const myOctokit = ProbotOctokit.plugin(retry).defaults({
  retry: {
    doNotRety: [400, 401, 403, 422],
  },
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
