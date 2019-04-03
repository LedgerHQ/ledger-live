
BUILD_PATH=android/app/build/outputs/apk/stagingRelease/app-stagingRelease.apk
curl --data-binary @"$BUILD_PATH"                     \
     -H "Authorization: Upload-Token $WALDO_ANDROID_UPLOAD_TOKEN"   \
     -H "Content-Type: application/octet-stream"      \
     -H "User-Agent: Waldo CLI/Android v1.1.0"        \
     https://api.waldo.io/versions
