
## Github

### Creating / Linking an account

In the Ledger Live development team, we use Github for hosting our software development and version control.
You will therefore need a Github account.
You have 2 possibilities :
- Create a new Github account dedicated for Ledger using an account name that respects these constraints: All in lower case, First letter of your first name, your last name, dash, ledger. Ex: jdupont-ledger for Jean Dupont.
  Then use this link to connect your newly created account to your Ledger's Google account : https://github.com/orgs/LedgerHQ/sso

OR

- Use your personal account, by connecting it to your Ledger's Google account : https://github.com/orgs/LedgerHQ/sso

On [this page](https://github.com/settings/organizations), you can see that you have joined the Ledger Github organisation.

### SSH and GPG keys

- Generate and link SSH key to your Github account using this nice guide : https://jdblischak.github.io/2014-09-18-chicago/novice/git/05-sshkeys.html
- On the same page where you added the newly created SSH key, on the information card of the key you should see a "Configure SSO" button. Click on the button and follow the process.
- Generate and link a GPG key to your Github account and Git using this nice guide : https://gist.github.com/ankurk91/c4f0e23d76ef868b139f3c28bde057fc

### Cloning

Clone the following Ledger Live repositories :

`git clone https://github.com/LedgerHQ/ledger-live.git`

> Small tip : You probably have Sentinel One on your computer. It is an antivirus that constantly scans all your files on your computer to ensure its security. However, it is not adapted to a development environment and will slow down your node package installations or builds enormously and thus kill your productivity. Contact me on Slack to have a solution to mitigate this problem :)

## Node.js

You should install a Node version manager, because you will regularly need to switch between node versions with Live.
Some recommend [NVM](https://github.com/nvm-sh/nvm#installing-and-updating), others recommend [N](https://github.com/tj/n#installation)

You need to install [Yarn](https://classic.yarnpkg.com/en/), a node packet manager used by Live.
`npm install --global yarn`

To be able to use executable installed from yarn, you will need to modify pour $PATH variable ([more info](https://linuxize.com/post/how-to-add-directory-to-path-in-linux/)) :
- Open your .bashrc with your favorite editor, ex: `nano ~/.bashrc`
- Add this line to the end of it : `export PATH="$PATH:$(yarn global bin)"`

## Code editor

The code editor used by the majority of developers in the Ledger Live team is **Visual Studio Code**.
You can install it using this guide : https://code.visualstudio.com/docs/setup/linux

As an alternative, you can install [Webstorm](https://www.jetbrains.com/fr-fr/webstorm/) or [VSCodium](https://vscodium.com/#install).

##  Ledger Live

### Ubuntu/Debian requirements

First, you need to install these packages :

- libudev and libusb to communicate with the devices on your system, in our case the Nano.
-  ruby and ruby-dev to install Bundler.

`sudo  apt-get  update  &&  sudo  apt-get  install  libudev-dev  libusb-1.0-0-dev ruby-dev ruby`

Then you need to install [bundler](https://bundler.io/), that will be used to install gem packages

`sudo  gem  install  bundler`

#### Udev Rules

You need to set up udev rules :

Go see: [ledger support doc](https://support.ledger.com/hc/en-us/articles/115005165269?utm_source=ledger_live_desktop&utm_medium=self_referral&utm_content=error_cantopendevice&support=true)

Or directly do: `wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash`

#### Metro watcher limits

Linux uses the inotify package to observe filesystem events, individual files or directories.

Since React / Angular hot-reloads and recompiles files on save it needs to keep track of all project's files. Increasing the inotify watch limit should hide the warning messages.

```
# insert the new value into the system config
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
​
# check that the new value was applied
cat /proc/sys/fs/inotify/max_user_watches
```

### Ledger Live Mobile

#### Android Studio

The easiest way to setup your Android environment is to install Android Studio

- Download Android Studio : https://developer.android.com/studio
- Unzip and launch the executable located in bin/studio.sh
- Tip: In the welcome window of Android Studio, in the bottom left corner, you can click on the "Add entry" little button to add a desktop entry to your Linux so you can easily open it again after.
- Open the ledger-mobile repository folder.

#### Android Studio SDK Manager

We will install all the Android necessary dependencies to build Ledger Live Mobile as well as additional tools.

In the top navigation bar, open the Tools->SDK Manager.
In the *SDK Platforms* tab, be sure that at least one SDK is installed (Android 10 ? 11 ? As you wish).
In the *SDK Tools* tab, be sure that these components are installed :
- Android SDK Build-Tools
- NDK
- CMake
- Android Emulator
- Android SDK Platform-Tools

#### Android Studio Emulator

In this part, we will focus on the installation of the Android emulator, necessary for Android development without the use of a dedicated device.

In the top navigation bar, open the Tools->Device Manager

In the "Device Manager" section that just opened, click on the "Create device" button.

I recommend that you take a phone that does not have a large screen or the latest version of Android, to be in line with most Ledger Live users.

#### Linking it all together

You need to modify your $PATH, like you have done with Yarn, so that your setup detects the SDK and the emulator :
- Open your .bashrc with your favorite editor, ex: `nano ~/.bashrc`
- Add theses lines to the end of it :
```
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
- Reload your environment using this command: `source ~/.bashrc`​

#### (Not mandatory) Set up your phone

If you prefer to use your Android phone rather than the emulator, you need to enable USB debugging.
To begin with, close any instance of the emulator you may have open.

Please follow this guide to enable it : https://www.embarcadero.com/starthere/xe5/mobdevsetup/android/en/enabling_usb_debugging_on_an_android_device.html

To verify that your phone is connected and recognized, you can launch this command :
`adb devices -l`
You should see a line at the bottom of "List of devices attached" containing the name of your phone.
If you don't see anything, try to launch again the command or check again the guide above.
If the command *adb* is not recognized, please verify that you have done every steps in the *Android Studio SDK Manager* (*adb* is contained in the *Android SDK Platform-Tools* module) and the *Linking it all together* chapters.

#### Launch

Launch these commands inside the ledger-live-mobile repository :

- `yarn` to download the latest node packages
- `yarn start` to start *Metro*, the bundler for React-native ([More Info](https://facebook.github.io/metro/))

Since Metro is a watcher, open a new terminal and `yarn android` to build and install the development application to your device. It will launch the emulator if it's not started yet or if there is no physical device connected.

After a few minutes, you should see Ledger Live Mobile start screen. Congrats ! 🎉

### Ledger Live Desktop

#### Launch

Launch these commands inside the ledger-live-desktop repository :

- `yarn` to download the latest node packages
- `yarn start` to start the process

After a few minutes, you should see Ledger Live Desktop start screen. Congrats !


#### (Optional) Setup VSCode for debugging

See [readme](https://github.com/LedgerHQ/ledger-live-desktop#debug) on Launch Configuration.



*Thanks to Alexandre Magaud for being my test subject for this guide and for writing a good part of it and a huge amount of notes !*
