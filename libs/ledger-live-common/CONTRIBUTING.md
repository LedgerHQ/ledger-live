# Contributing

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

This repository hosts `@ledgerhq/live-common` JavaScript library which centralize the business logic work of Ledger Live.

## JavaScript styleguide

* ES6+ features.
* [prettier](https://prettier.io/) for formatting convention. You can run `yarn prettier`.
* ESLint is used to enhance code quality. Check with `yarn lint`.
* Flowtype is currently getting used to typecheck the library, but we are currently migrating to TypeScript.

> NB. for the 3 points above, the best is to have integration of Prettier,
> ESlint, Flowtype in your text editor (there are plugin for most editors).

## Expectations

PR that are not ready to get merged will be kept as "Draft PR".

As documented in the PR template, there are two very important points we require contributors to focus on:

### Changes have no impact

**The impact of your changes must be made as limited as possible.**

As we want to have the ability to merge things quickly and have small iterations, this can only work if your changes are non-breaking which means they do not require any extra modification in user land side (Ledger Live Desktop, Ledger Live Mobile) **to still make the library works the same way**.

Of course you may introduce new features for the UI side, it just should not affect the existing work / only affect it in a way that the result of this is "acceptable" and "stable" (e.g. a bugfix is a change, but it's the purpose of the bugfix to fix it).

There are always exception to break this rule, when you do break it however, you need to carefully document it in the PR so we can report that documentation back in the release notes and organise the work load. The complexity of that PR will however be defacto higher and harder with less guarantee to merge.

We want to avoid locked situation where we can't merge your work because it's too impacting on userland but you still need that work merged to test against your changes on LLD/LLM.

Here are a few tips:

- When you have a new feature that need changes in the existing work, introduce a new environment variable in `env.js` that will allow you to implement a code branching
- When you have a completely new rework of an existing feature, feel free to make a `v2` folder where the new logic will leave. The existing work will be not impacted and considered a "v1" in which you can also start documentation a **deprecation path** (use JS comments, it will be on maintainer side to organize the deprecation and planning the sunset)
- when adding new methods, fields, it should be ok as long as you don't change the main interface. You can ship things "silently" without userland to use it yet.

### Changes must have test coverage and pass the CI

As we allow to be very flexible at merging things quickly in live-common, we also expect you to deliver unit tests with the features you deliver or improve the tests when you fix a bug.
