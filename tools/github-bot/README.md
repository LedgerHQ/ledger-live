# live-github-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) to enhance developer experience on the ledger-live repository

In short, `live-github-bot` is a tool deployed to Vercel which accepts incoming requests based on some Github Events.  
It provides us with useful actions and tools we can provide for developers, as well as a deeper developer experience when working on Ledger Live mono repo.  


## Code Architecture

We've structured the code to make it work as **plugins** that extend the github app.

```
src
├── commands : new functionality added to github through commenting or CTAs in check runs reports
├── features : features that changes the behavior and enhance PR checks and reports (eg: linting commit messages, auto close PR...)
├── tools    : common utilities
└── index.ts : entry point
```

The `index.ts` is where we activate the wanted plugins, keeping it simple and clean.
All logic related stuff either goes into `features` or `commands` folders, depending on what we want to implement.

## Continuous Integration Orchestration

Being restricted by Github's default behavior in the context of a mono repo, we could not have a clean output for our CI jobs (doppleganger jobs for required checks, impossibility to have more granular CI...).  
Thus, instead on relying on Github default event to create report on the pull requests, we've decided to tailor the experience to our needs.

> Usually, workflows (CI jobs) are triggered on `pull_request` or `push` events

In the case of a mono repository, with linked dependencies between the different packages, it was not possible to tell Github CI to only accept jobs on the **affected** code.
Add to that the missing required checks if you skip some specific jobs because the code was not affected, and we are left with a PR in limbo state, with pending required checks that will never happen.

To circumvent that, we use the bot to orchestrate our CI.

### Github Runs and Checks

When using the _basic_ behavior of the `push` and `pull_request` event, **checks** are created for each job in all the triggered workflow, and are shown on the PR with their current status (pending, success, error...).
It bloats the check list with a lot of unneeded notifications, and doesn't provide much information.
**Checks** can actually create by the github bot, and enhance the outputs of our check.

To prevent workflows from creating checks automatically, the trigger of the CI is not on `push` or `pull_request` anymore but on `workflow_dispatch`.
This means the workflow runs on a manual trigger, decorrelated from any PR, and thus won't create checks.

This is where the github bot comes into place. We only trigger one workflow when a PR is created or updated. This job (the `@Gate` in our CI) will basically analyse the code that has been changed and create a list of affected packages (think dependencies). 
The github bot listens to a finish event for the `@Gate` job, and fetches the list of **affected**, and from this determines which workflows need to be triggered.

Then we create a _meta_ check, the `@@Watcher`, and as its name implies it will watch the different jobs triggered previously and report once all of them have finished.

This way, the only **required** check in a PR is now `@@Watcher`. Each of the watched job will also provide an output of what happened, as well as some basic troobleshooting tips to debug when something fails.

### Code

The code of the bot is commented to give insight of how thing work together.
More informations on how the CI is orchestrated can be found here

```
src
└── features
    └── orchestrator
```

> Deeper informations about the orchestrator can be found [here](./docs/orchestrator.md).

## Commands

Commands are _executable_ actions that we can run by commenting on the pull request, and sometimes as CTA action from some **checks** outputs.
We have created handy utility functions to make command creation easier.

To trigger a command, comment on the desired pull request the name of the command prefixed by a `/`
Eg:
```
/generate-screenshots
or
/regen-pods
or
/regen-doc
```

We can always add more features in the future.  
For more informations/inspiration, you can look into the commands already created as they all follow a similar pattern.
