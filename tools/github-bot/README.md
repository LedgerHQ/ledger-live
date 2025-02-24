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

### Code

The code of the bot is commented to give insight of how thing work together.
More information on how the CI is orchestrated can be found here

```
src
└── features
    └── orchestrator
```

> Deeper information about the orchestrator can be found [here](./docs/orchestrator.md).

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
For more information/inspiration, you can look into the commands already created as they all follow a similar pattern.
