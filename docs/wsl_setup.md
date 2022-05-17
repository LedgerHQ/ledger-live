# LLM Setup

## Installations

### On WSL

Install bundler package

```bash
sudo gem install bundler
```

Install JDK v11 package

```bash
sudo apt-get install openjdk-11-jdk
```

Install watchman package

```bash
sudo apt-get install watchman
```

Add the following env vars in your `~/.bashrc` / `~.zshrc` / `~/.profile` file :

```bash
JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
PATH=$PATH:$HOME/bin:$JAVA_HOME/bin
ANDROID_SDK_ROOT=~/Android/Sdk

export JAVA_HOME
export JRE_HOME
export PATH
export ANDROID_SDK_ROOT
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$HOME"/Android/Sdk/platform-tools"
export PATH=$PATH:$HOME"/Android/Sdk/emulator/emulator"
export PATH=$PATH:$HOME"/Android/Sdk/tools"
export PATH=$PATH:$HOME"/watchman/linux/bin"
export PATH="$(yarn global bin):$PATH"
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
```

### On Windows

Install and configure the Android Studio environment by following [this doc](https://reactnative.dev/docs/environment-setup)

Make sure `adb` on WSL and Windows are of the version by running `adb version` on both sides. If the `adb` version on Windows isn't the same as on WSL, install the correct version on Windows.

## Run LLM

- Wsl : run `adb kill-server` to make sure the process is not running
- Windows : run `adb kill-server` to make sure the process is not running
- Phone : plug the device to the computer
- Phone : set the link as file transfer
- Phone : enable debug through USB
- Wsl : run `adb connect <device ip>`
- Wsl : run `adb -s <device ip> reverse tcp:8081 tcp:8081`
- Wsl : run `yarn android`
- Wsl : run `yarn start`

NOTE : For some reason, your phone and computer must be connected to the same network.
