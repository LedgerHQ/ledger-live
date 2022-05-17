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
  const username = core.getInput("username");
  const organisation = core.getInput("organisation");
  const token = core.getInput("token");
  const octokit = github.getOctokit(token);

  try {
    const { data: orgs } = await octokit.rest.orgs.listForUser({
      username,
      per_page: 100,
    });

    core.info(JSON.stringify(orgs, null, 2));

    const isMember = orgs.some(
      ({ login }) => login.toLowerCase() === organisation.toLowerCase()
    );

    core.setOutput("is-org-member", isMember);
  } catch (error) {
    core.info(JSON.stringify(error, null, 2));
    core.setFailed("Error fetching informations");
  }
};

main();
