![](https://pbs.twimg.com/profile_banners/1103191459409420288/1573207178/1500x500)
### 🌈️ Rainbow
> the pocket robot for your internet money ⁖𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗘𝘁𝗵𝗲𝗿𝗲𝘂𝗺⁖ 

📲️ [Available on the iOS App Store.](https://apps.apple.com/us/app/rainbow-ethereum-wallet/id1457119021)

🐦️ [Follow us on Twitter](https://twitter.com/rainbowdotme)

## Requirements

* A computer running macOS.
* NVM installed: https://github.com/creationix/nvm
* Install CocoaPods by running `sudo gem install cocoapods`
* Install Watchman `brew install watchman`
* Install the latest version of XCode: https://developer.apple.com/xcode/

## How to run the project

If you are new to React Native, this is a helpful introduction: https://facebook.github.io/react-native/docs/getting-started.html

1. Clone the GitHub repository to your machine.

2. Run `nvm use` to use set version of node for this project

3. Run `yarn` to get all of the packages required.

4. Run `yarn nodeify`.

5. Install required Pods by running `yarn install-pods`.

6. Run `yarn ios` to build the project for XCode.

7. Open `rainbow-wallet/ios/RainbowWallet.xcworkspace`.

8. Run the project by clicking the play button.

## CodePush

In order to use code push you must be logged into the correct Microsoft App Center account.

### Prerequisites
```
npm install -g code-push
code-push login
```

At this point you will be required to log into the account tied to the code push public keys in Info.plist

### Deployment
```
code-push release-react RainbowWallet-iOS ios -d <DEPLOYMENT>
```

The deployment can either be `Staging` or `Production` depending on the mode of the application you wish to update was built in through XCode.

### Local Builds

In order to build the application in "release" mode but not use the code push distribution you must build the application using the scheme `LocalRelease`.

Building the application with the `Staging` scheme or `Release` scheme will result in your bundle being replaced by the live code push deployment on resume of the application.
