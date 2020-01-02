const Octokit = require('@octokit/rest')
const fs = require('fs')

const content = fs.readFileSync(process.argv[2] , 'utf-8')
const github = new Octokit({
    auth: process.env.GH_TOKEN
})

github.issues.create({
    owner: "LedgerHQ",
    repo: "ledger-live-common",
    title: "device appsUpdateTestAll has failed",
    body: content
})