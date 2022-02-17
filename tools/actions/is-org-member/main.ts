// import * as github from '@actions/github';
import * as core from "@actions/core";

// function checkStatus(result) {
//   if (result.status >= 200 && result.status < 300) {
//     return result;
//   }
//   core.setFailed(`Received status ${result.status} from API.`);
//   process.exit();
// }

const main = async function (): Promise<void> {
  core.debug("Decrepated for now");
  // const username = core.getInput('usename');
  // const organisation = core.getInput('organisation');
  // const token = core.getInput('token');

  // const octokit = github.getOctokit(token);

  // try {
  //   const { data: orgs } = checkStatus(
  //     await octokit.rest.orgs.listForUser({
  //       username,
  //       per_page: 100,
  //     })
  //   );

  //   let members = [];

  //   const getAllMembers = async (page = 0) => {
  //     const { data: lhq } = await octokit.rest.orgs.listMembers({
  //       org: organisation,
  //       per_page: 100,
  //       page,
  //     });

  //     members = members.concat(lhq.map((member) => member.login));

  //     if (!lhq || !lhq.length) {
  //       return;
  //     }

  //     page++;

  //     return getAllMembers(page);
  //   };

  //   await getAllMembers();

  //   const isMember = orgs.some(
  //     ({ login }) => login.toLowerCase() === organisation.toLowerCase()
  //   );

  //   if (!isMember) {
  //     core.setFailed(
  //       `${username} is not part of the ${organisation} organisation`
  //     );
  //   }
  // } catch (error) {
  //   core.setFailed('Error fetching informations');
  // }
};

main();
