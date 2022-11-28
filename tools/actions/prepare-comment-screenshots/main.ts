import * as core from "@actions/core";
import { promises as fs } from "fs";

const main = async () => {
  const imagesObject = await fs.readFile(core.getInput("images"), "utf8");
  const actor = core.getInput("actor");
  const noActor = core.getBooleanInput("no-actor");

  const parsed = JSON.parse(imagesObject);
  let str = "";
  let hasFailed = false;
  for (const platform in parsed) {
    const current = parsed[platform];
    if (Array.isArray(current) && current.length) {
      if (!hasFailed) hasFailed = true;
      str += `
<strong>${platform}</strong>

| Actual | Diff | Expected |
|:------:|:----:|:--------:|
`;
      current.forEach(({ actual, diff, expected }) => {
        str += `| ${actual.name} | ${diff.name} | ${expected.name} |
| ![${actual.name}](${actual.link}) | ![${diff.name}](${diff.link}) | ![${expected.name}](${expected.link}) |
`;
      });
      str += "\n\n";
    }
  }

  const imgDiffFailed = !!hasFailed;

  str = `
  ${
    noActor
      ? ""
      : `@${actor}
  `
  }<details>
<summary><b>Screenshots: ${imgDiffFailed ? "❌" : " ✅"}</b></summary>
<p>

${
  imgDiffFailed
    ? `It seems this PR contains screenshots that are different from the base branch.
If you are sure all those changes are correct, you can comment on this PR with **/generate-screenshots** to update those screenshots.
> Make sure all the changes are correct before running the command, as it will commit and push the new result to the PR.

${str}`
    : "There are no changes in the screenshots for this PR. If this is expected, you are good to go."
}

</p>
</details>


`;

  core.setOutput("body", str);
  core.setOutput("failed", hasFailed);
};

main().catch((err) => core.setFailed(err));
