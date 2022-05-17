import * as core from "@actions/core";
import fetch from "isomorphic-unfetch";

const regexp =
  /@ledgerhq\/live-common@[~|^]?(\d+.){2}\d+(.+)?,?.+:\n\s+version\s+"(\d+.){2}\d+(.+)?"/;

const main = async () => {
  const repo = core.getInput("repo");
  const owner = core.getInput("owner");
  const ref = core.getInput("ref");

  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/yarn.lock`
  );
  const text = await res.text();
  const [match] = text.match(regexp);
  const [, version] = match.split("version").map((v) => v.trim());

  const r = /"/g;
  const cleanVersion = `${version}`.replace(r, "");

  core.setOutput("version", cleanVersion);
};

main().catch((err) => core.setFailed(err));
