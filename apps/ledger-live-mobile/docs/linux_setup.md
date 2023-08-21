# Setup your dev env

## Initial machine

To setup your machine you only need a fresh new Ledger computer configure by IT service
If you have authorization you can disable sentinelone with :
```bash
    sudo systemctl disable sentinelone
```

## Nano Support
On Linux, you will have to setup some udev rules as explained here GitHub - LedgerHQ/udev-rules: udev rules to support Ledger devices on Linux


## node
install nvm
https://github.com/nvm-sh/nvm#installing-and-updating
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
command -v nvm
```

find the node version used to build apps
https://github.com/LedgerHQ/ledger-live-desktop/blob/develop/.github/workflows/bundle-app.yml
```yml
with:
    node-version: 14.x
```

Then find the latest on this version and install it
```bash
nvm ls-remote
nvm install x.x.x
```

You have npm installed by default with node but Live Team use yarn instead
```bash
npm install --global yarn
```

## Configure Git

1 - ssh key
```bash
ssh-keygen -t ed25519 -C "firstname.lastname@ledger.com"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

2 - GPG key
```bash
gpg --full-generate-key
gpg --list-secret-keys --keyid-format=long
gpg --armor --export YOUR_KEY_ID

git config --global commit.gpgsign true
```

Note: if you encounter this error when you commit `error: gpg failed to sign the data fatal: failed to write commit object`

Add `export GPG_TTY=$(tty)` to your .zshrc or .bashrc

3 - Install gh (Github cli)
https://github.com/cli/cli
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

You will essentially use the command below to create PRs
```bash
gh pr create
```

## VSCODE

install eslint extension
and add this to your settings.json file

```json
{
    ...
    "editor.formatOnSave": true,
    "eslint.format.enable": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
}
```

## LLM

####
sudo gem install bundler

## install JDK
sudo apt-get install openjdk-11-jdk

#### Android Studio
https://developer.android.com/studio/install#linux

Download latest build
https://developer.android.com/studio

Install the required libraries for 64-bit machines.
sudo apt-get install libc6:i386 libncurses5:i386 libstdc++6:i386 lib32z1 libbz2-1.0:i386

Use the below command to download from the terminal.

tar -zxvf android-studio-ide-*-linux.tar.gz
sudo mv android-studio /opt/

Link the executable to /bin directory so that you can quickly start Android Studio using android-studio command.

sudo ln -sf /opt/android-studio/bin/studio.sh /bin/android-studio

Create a .desktop file under /usr/share/applications directory to start Android Studio from Activities menu.

sudo nano /usr/share/applications/android-studio.desktop

Use the following information in the above file.

[Desktop Entry]
Version=1.0
Type=Application
Name=Android Studio
Comment=Android Studio
Exec=bash -i "/opt/android-studio/bin/studio.sh" %f
Icon=/opt/android-studio/bin/studio.png
Categories=Development;IDE;
Terminal=false
StartupNotify=true
StartupWMClass=jetbrains-android-studio
Name[en_GB]=android-studio.desktop

## Before Dev
Install watchman
```bash
apt-get install watchman
```

add all env vars needed to your ~/.bashrc file :
```
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
PATH=$PATH:$HOME/bin:$JAVA_HOME/bin

export JAVA_HOME
export JRE_HOME
export PATH

ANDROID_SDK_ROOT=~/Android/Sdk
export ANDROID_SDK_ROOT
export ANDROID_HOME=~/Android/Sdk

export PATH=$PATH:$HOME"/Android/Sdk/platform-tools"
export PATH=$PATH:$HOME"/Android/Sdk/emulator/emulator"
export PATH=$PATH:$HOME"/Android/Sdk/tools"
export PATH="$(yarn global bin):$PATH"
export PATH=$PATH:$HOME"/watchman/linux/bin"
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

export NODE_OPTIONS=--max-old-space-size=8192
```

#### Dev on android

You have to setup your device
- activate developer mode depending on android version and device
- accept debug through USB
- plug your device to your computer
- set the link as a file transfer

Then start your terminal:
https://reactnative.dev/docs/running-on-device#method-1-using-adb-reverse-recommended-2
```bash
adb devices
adb -s <device name> reverse tcp:8081 tcp:8081
yarn android
yarn start
```
