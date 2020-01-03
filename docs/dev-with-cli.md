### Developing with `ledger-live` CLI

To run it for development and have the latest sourcecode running we need to either copy the lib folder of live-common in cli/node*modules or use something like yalc. \_We used to use yarn link but symlink are not properly working and creating dup issues.*
You likely want to run `yarn watch` in a terminal and do this in another terminal (from top level):

```
yalc publish # link live-common
cd cli/
yarn
yalc add @ledgerhq/live-common
yarn link    # will make ledger-live CLI available
yarn watch   # incremental build as well
```

Assuming that `yarn global bin` is in your `$PATH`,

You can run:

```
ledger-live
```

and it will always use your latest sourcecode.
