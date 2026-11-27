/** The upgrade PR's title and body. Koda replaces `<humanReview>` with what needs a human. */
export const pullRequest = {
  title: "chore(deps): upgrade Lumen",
  body: `### 📝 Description

Automated Lumen upgrade, run by Koda from \`.koda/plans/lumen-upgrade.ts\`. Each Lumen release rebases this PR on \`develop\` and moves it to the new latest, so review its latest state.

### 👀 Needs a human

<humanReview>

### 🔗 Context

- **ADR**: [ADR 027: Automated Lumen upgrades in consumer repos](https://ledgerhq.atlassian.net/wiki/spaces/DLS/pages/7689666642)`,
};
