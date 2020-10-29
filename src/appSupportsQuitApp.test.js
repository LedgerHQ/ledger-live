// @flow
import network from "./network";
import { minAppVersion, req } from "./appSupportsQuitApp";

test("appSupportsQuitApp - Check if we have all apps from provider 1 listed", () => {
  return network(req).then(({ data }) => {
    // Extract the names and versions from the latest snapshot
    if (data && "application_versions" in data) {
      const latestAppsAndVersions = data.application_versions.reduce(
        (acc, app) => {
          acc[app.name] = app.version;
          return acc;
        },
        {}
      );

      expect(Object.keys(latestAppsAndVersions).sort()).toMatchObject(
        Object.keys(minAppVersion)
      );
    }
  });
});
