import * as github from "@actions/github";
import * as core from "@actions/core";

// function checkStatus(result) {
//   if (result.status >= 200 && result.status < 300) {
//     return result;
//   }
//   core.setFailed(`Received status ${result.status} from API.`);
//   process.exit();
// }

const main = async function(): Promise<void> {
  try {
    const username = core.getInput("username");
    const org = core.getInput("organisation");
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);

    await octokit.rest.orgs.checkMembershipForUser({
      org,
      username,
    });

    core.setOutput("is-org-member", true);
  } catch (error) {
    console.error(error);
    core.setOutput("is-org-member", false);
  }
};

main();
