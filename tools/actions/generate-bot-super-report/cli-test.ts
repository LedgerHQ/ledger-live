import { generateSuperReport, loadReports } from "./logic";

async function main() {
  const [, , githubToken, branch, days] = process.argv;
  const reports = await loadReports({
    branch,
    days,
    githubToken,
    environment: undefined,
  });
  const res = generateSuperReport(reports, days);
  console.log(res);
}

main().catch(e => {
  console.error(String(e));
  process.exit(1);
});
