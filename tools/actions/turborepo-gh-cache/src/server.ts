import { getInput } from "@actions/core";
import * as cache from "@actions/cache";
import express from "express";
import * as path from "path";
import * as fs from "fs";
import asyncHandler from "./utils/asyncHandler";
import {
  cacheDirectory,
  absoluteCacheDirectory,
  portFileName,
} from "./utils/constants";

async function startServer() {
  const app = express();
  const serverToken = getInput("server-token", {
    required: true,
    trimWhitespace: true,
  });

  app.all("*", (req, res, next) => {
    console.info(`Got a ${req.method} request`, req.path);
    const { authorization = "" } = req.headers;
    const [type = "", token = ""] = authorization.split(" ");

    if (type !== "Bearer" || token !== serverToken) {
      return res.status(401).send("Unauthorized");
    }

    next();
  });

  app.get(
    "/v8/artifacts/:artifactId",
    asyncHandler(async (req: any, res: any) => {
      const { artifactId } = req.params;
      const filename = artifactId + ".gz";
      const cacheKey = await cache.restoreCache(
        [`${cacheDirectory}/${filename}`],
        artifactId,
        undefined,
        {
          timeoutInMs: 5000,
        }
      );
      if (!cacheKey) {
        console.log(`Artifact ${artifactId} not found.`);
        return res.status(404).send("Not found");
      } else {
        console.log(
          `Artifact ${artifactId} downloaded successfully to ${cacheDirectory}/${filename}.`
        );
      }

      fs.createReadStream(path.join(absoluteCacheDirectory, filename))
        .pipe(res)
        .on("error", (err) => {
          console.error(err);
          res.end(err);
        });
    })
  );

  app.put(
    "/v8/artifacts/:artifactId",
    asyncHandler(async (req, res) => {
      const artifactId = req.params.artifactId;
      const filename = `${artifactId}.gz`;

      const writeStream = fs.createWriteStream(
        path.join(cacheDirectory, filename)
      );

      try {
        await new Promise((resolve, reject) => {
          req.pipe(writeStream);
          req.on("end", resolve);
          writeStream.on("error", reject);
        });
      } catch (err) {
        console.error(err);
        return res.status(500).send("Error while writing artifact to disk.");
      }

      await cache.saveCache([`${cacheDirectory}/${filename}`], artifactId);
      res.end();
    })
  );

  app.post("/v8/artifacts/events", (req, res) => {
    // Analytics endpoint, just ignore it
    res.status(200).send();
  });

  const server = app.disable("etag").listen(0);
  server.once("listening", () => {
    const port = "" + server.address().port;
    console.log(`Cache dir: ${cacheDirectory}`);
    console.log(`Local Turbo server is listening at http://127.0.0.1:${port}`);
    fs.writeFileSync(path.resolve(absoluteCacheDirectory, portFileName), port);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
