const fs = require("fs");

require("dotenv").config();

function setupFile(src, target, key) {
  if (fs.existsSync(target)) {
    return;
  }
  fs.copyFileSync(src, target);
  const buffer = fs.readFileSync(target).toString();
  const update = buffer.replace(/__FIREBASE_API_KEY__/g, key);
  fs.writeFileSync(target, update);
}

setupFile(
  "./scripts/setup-google-services/android-credentials.json",
  "./android/app/google-services.json",
  process.env.FIREBASE_ANDROID_API_KEY || "",
);

setupFile(
  "./scripts/setup-google-services/ios-credentials.plist",
  "./ios/GoogleService-Info.plist",
  process.env.FIREBASE_IOS_API_KEY || "",
);
