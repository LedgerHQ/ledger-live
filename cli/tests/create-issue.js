const Octokit = require('@octokit/rest')
const content = process.argv[2]

const github = new Octokit({
    auth: process.env.GH_TOKEN
})

github.issues.create({
    owner: "LedgerHQ",
    repo: "ledger-live-common",
    title: "device appsUpdateTestAll has failed",
    body: content
})