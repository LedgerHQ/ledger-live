import * as core from "@actions/core";
import fetch from "isomorphic-unfetch";

const BASE_URL = "https://ledgerhq.atlassian.net/issues/?jql=";
const regexp = /(LL|LIVE)-\d+/gi;

const main = async () => {
  const base = core.getInput("base");
  const current = core.getInput("current");
  const repo = core.getInput("repo");
  const owner = core.getInput("owner");

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${current}`
  );
  const json = await res.json();
  const issues = json.commits
    .map((commit) => commit.commit.message)
    .map((message) => {
      const res = [...message.matchAll(regexp)].map(([issue]) => issue);
      return res.length ? res : null;
    })
    .filter(Boolean)
    .flat();
  const issueMessage = `issue in (${[...new Set(issues)].join(",")})`;
  const encoded = encodeURIComponent(issueMessage);

  const url = `${BASE_URL}${encoded}`;

  core.setOutput("url", url);
};

main().catch((err) => core.setFailed(err));
