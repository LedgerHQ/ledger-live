# ledger-live-mobile e2e testing

This project uses [Detox](https://github.com/wix/Detox) and [Jest](https://jestjs.io/) for end to end testing, please refer to the documentation of those projects for the specifics. In this folder you will find the key parts for testing a flow in the application: the setup, specs and flow definitions.

- `./setups`: This is the application data that will be used to start the session, it contains all the information regarding user settings, existing accounts, operations, balances, etc. It allows us to test different scenarios with independent configurations

- `./engine/flows`: Contain a series of assertions and instructions that allow the engine to navigate the application interacting with it and making sure that things are where and how we expect them to be.               

- `./specs`: The test suites themselves. We make use of the helpers and combine the snippets from the flows to build the different test scenarios. Ideally we should be able to reuse parts from flows in the specs.


### How to test

> I will focus on Android testing for this but most instructions will still apply to iOS to some extent.

When we make changes that might have an impact on a flow covered by Detox we have to make sure that we still pass the tests or adapt the tests to the new changes if we need to. In order to build and run the detox suite we require:

- A running emulator specifically named `Nexus_5X_API_29_x86` that detox will look for upon launching. We could make this use the first device but as of now it's not dynamic.
- For a staging build
  - `yarn e2e:build --configuration android.staging` to prepare the setup
  - `yarn e2e:test --configuration android.staging` to actually run the tests
- For a debug build
  - Have an instance of metro bundler running, to do this run `yarn start` from the root of LLM
  - `yarn e2e:build --configuration android.debug` to prepare the setup
  - `yarn e2e:test --configuration android.debug` to actually run the tests

