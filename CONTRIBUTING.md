# Contributing

Thanks for considering contributing to Ledger Live!


## Opening issues

If you find a bug, please feel free to [open an issue](https://github.com/ledgerhq/ledger-live-common/issues).

If you taking the time to mention a problem, even a seemingly minor one, it is greatly appreciated, and a totally valid contribution to this project. Thank you!

## Fixing bugs

We love pull requests. Here’s a quick guide:

1. [Fork this repository](https://github.com/ledgerhq/ledger-live-common/fork) and then clone it locally:

  ```bash
  git clone https://github.com/ledgerhq/ledger-live-common
  ```

2. Create a topic branch for your changes:

  ```bash
  git checkout -b fix-for-that-thing
  ```
3. Commit a failing test for the bug:

  ```bash
  git commit -am "Adds a failing test to demonstrate that thing"
  ```

4. Commit a fix that makes the test pass:

  ```bash
  git commit -am "Adds a fix for that thing!"
  ```

5. Run the tests:

  ```bash
  npm test
  ```

6. If everything looks good, push to your fork:

  ```bash
  git push origin fix-for-that-thing
  ```

7. [Submit a pull request.](https://help.github.com/articles/creating-a-pull-request)

## Features and expectation of ledger-live-common project

ledger-live-common is the common ground for [Ledger Live desktop](https://github.com/LedgerHQ/ledger-live-desktop) and [Ledger Live mobile](https://github.com/LedgerHQ/ledger-live-mobile).

It contains most of its core business logic.

**We try to do as less breaking changes as possible**. What we mean by breaking changes, it means any changes in live-common that would need the userland (Ledger Live Desktop, Ledger Live Mobile) to also change codes to keep making that live-common version to work should be avoided.
Adding new features are ok, but they need to be made as much as possible "not changing" when the userland still uses the old API.

Here are a few guidelines:
- if you have a completely new rework of an existing stack, it may be wise to have a `v2/` folder, specifically when there is a risk in it.
- when adding new methods, fields, it should be ok as long as you don't change the main interface. You can ship things "silently" without userland to use it yet.
- Libraries upgrade are the only exception here.

## Expectation of PR information

- the impact of each PR needs to be explicitly written.
- code need to be covered by tests. (unit tests, dataset tests or bot tests)
- document everything that userland need to do to upgrade to your changes (if relevant)
