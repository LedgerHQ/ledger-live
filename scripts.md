# Fastlane & Scripts

================

## Installation

Make sure you have the latest version of the XCode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

Most of the public lanes are bound to yarn scripts, so there is no need to manually trigger them, but in some cases you might need to ¯\_(ツ)_/¯

## Available Actions

### Internal
```
yarn internal
```

Will trigger a full workflow of release.  
The action will check we are on the correct branch, make a prerelease version, bump the version codes, build the apps (iOS and Android) and upload them to their respective store.  
It is to be used either on our local iMac CI (reprezentz) with Jenkins, and if we're lucky, with Github Actions at some point.

### Beta

```
yarn beta
```

Almost the same as `yarn internal`, except it is made to be launched by someone in the team.  
This action will not `yarn version` so, either it has been done already, or the developer doing this must update the app version before doing this. The rest of the flow is the same, it will bump the version codes, build both apps and upload them to the stores.  
Another thing to note, this script will assume that your `origin` remote is your own fork, and that the base repo **ledgerhq** is setup as `upstream`.

----

## Specifics

### Beta

```
yarn ios:beta // uses lane: ios clean_beta
yarn android:beta // uses lane: android clean_beta
```

Will either build a compliant iOS or Android app and push it to their respective store.

### IPA and APK

```
yarn ios:ipa // uses lane: ios build_ipa
yarn ios:ipadev // uses lane: ios build_ipa
yarn android:apk // uses lane: android apk
```

Will create either an IPA or APK of the app eligible to be uploaded to their respective store, except for `yarn ios:ipadev`


### Uploads

```
yarn ios:upload // uses lane: ios upload
yarn android:upload // uses lane: android upload
```
Will respectively upload either the IPA (built with `yarn ios:ipa`) or the APK (build with `yarn android:apk`) to the App Store or Play Store

### Internal

```
yarn ios:internal
yarn android:internal
```

Will run a full workflow except for the `yarn version`, thus the developer will have to do it before hand. Will bump the version code, build and upload, either iOS or Android. This flow is made to be used if different developers want to make a release of one of the platform without the other (or just to split the release flow between 2 people)