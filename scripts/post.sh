#!/bin/bash

# see https://github.com/react-native-community/react-native-camera#face-detection-steps
if [ -e node_modules/react-native-camera/ios/FaceDetector ] ; then
  rm -rf node_modules/react-native-camera/ios/FaceDetector
fi
cp node_modules/react-native-camera/postinstall_project/projectWithoutFaceDetection.pbxproj node_modules/react-native-camera/ios/RNCamera.xcodeproj/project.pbxproj

# Create the dev .env file with APP_NAME if it doesn't exist
if ! [ -f .env ]; then
  echo 'APP_NAME="LL [DEV]"' > .env;
fi 

flow-typed install -s

# if [ "$CI" != "true" ] ; then
#   rndebugger-open
# fi
