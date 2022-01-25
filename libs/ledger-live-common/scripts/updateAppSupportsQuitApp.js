const axios = require("axios");
const { req, minAppVersion } = require("../lib/appSupportsQuitApp");

function main() {
  axios.request(req).then(({ data }) => {
    // Extract the names and versions from the latest snapshot
    if (data && "application_versions" in data) {
      const latestAppsAndVersions = data.application_versions.reduce(
        (acc, app) => {
          acc[app.name] = app.version;
          return acc;
        },
        {}
      );
      let changed = false;
      for (const appName in latestAppsAndVersions) {
        if (appName in minAppVersion) {
          // We're ok, ignore even if version changes
        } else {
          // Add it
          changed = true;
          minAppVersion[appName] = latestAppsAndVersions[appName];
        }
      }
      if (changed) {
        // Sort it for ocd
        const ordered = {};
        Object.keys(minAppVersion)
          .sort()
          .forEach((key) => {
            ordered[key] = minAppVersion[key];
          });
        console.log(ordered);
      } else {
        console.log("No new apps");
      }
    }
  });
}

main();
