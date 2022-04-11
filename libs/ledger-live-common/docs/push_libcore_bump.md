## A new lib-ledger-core version is out, what now?

### Prerequisite

- Make sure that the version landed on develop. https://github.com/LedgerHQ/lib-ledger-core/commits/develop
- Make sure that on that commit, the CI is passing for at least all the `build_*_release` task as well as the `Release Visual Studio 15 2017` build inside `appveyor`
- figure out the libcore version. For instance `3.5.0-rc-8796ba`

### bump on lib-ledger-core-node-bindings

**You must have access to NPM and Github right to push to lib-ledger-core-node-bindings**

- clone https://github.com/LedgerHQ/lib-ledger-core-node-bindings and go to master, make sure to be in sync with upstream
- Confirm with libcore team that there is no diff of libcore interface since the last changes, otherwise they must provide a bindings PR and update the libcoreVersion in package.json.
- Otherwise, edit package.json to change the libcoreVersion to the correct one that you figured out in Prerequisite.
- commit that change and push it to upstream
- now, run this to publish it:

```
yarn publish
# replace upstream by the remote name of upstream repo
git push upstream master
git push upstream master --tags
```

- Now, wait that our CI is building the prebuild, you can see the status on the Github commit
- When the prebuild are pushed. Go to https://github.com/LedgerHQ/lib-ledger-core-node-bindings/releases and edit the tag to RELEASE it

(It is very important for the prebuild to be accessible)

### bump on lib-ledger-core-react-native-bindings

- clone https://github.com/LedgerHQ/lib-ledger-core-react-native-bindings and go to master, make sure to be in sync with upstream
- Confirm with libcore team that there is no diff of libcore interface since the last changes, otherwise they must provide a bindings PR and update the libcoreVersion in preinstall.js.
- Otherwise, edit preinstall.js to change the LIB_CORE_VERSION to the correct one that you figured out in Prerequisite.
- commit that change and push it to upstream
- now, run this to publish it:

```
yarn publish
# replace upstream by the remote name of upstream repo
git push upstream master
git push upstream master --tags
```

That's all.

### Bump on LLD and LLM

Once the work above is solved, we can independently update on both ledger-live-desktop and ledger-live-mobile project that new lib core bindings version. This is in scope of Ledger Live team.
A good practice is also to update it in the ledger-live-common CLI project so we can have latest libcore tested against the CI and the bot.

