import { createNodeMiddleware, createProbot } from "probot";
import app from "../../../src/index";

export default createNodeMiddleware(app, {
  probot: createProbot({
    overrides: {
      logLevel: "info",
    },
  }),
  webhooksPath: "/api/github/webhooks",
});
