import { getInput } from "@actions/core";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import express from "express";
import * as path from "path";
import * as fs from "fs";
import { PassThrough } from "stream";
import asyncHandler from "./utils/asyncHandler";
import { cacheDirectory, absoluteCacheDirectory, portFileName } from "./utils/constants";

async function startServer() {
  const app = express();
  const client = new S3Client({
    region: getInput("region"),
  });
  const bucket = getInput("bucket-name");
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

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: filename,
      });

      try {
        // const response = await client.send(command);
        // const byteArray = response?.Body?.transformToByteArray();
        const item = await client.send(command);

        console.log(`Artifact ${artifactId} streamed successfully`);
        return (item?.Body as Readable)?.pipe(res);
      } catch (err) {
        console.log(`Artifact ${artifactId} not found.`);
        return res.status(404).send("Not found");
      }
    }),
  );

  app.put(
    "/v8/artifacts/:artifactId",
    asyncHandler(async (req, res) => {
      const artifactId = req.params.artifactId;
      const filename = `${artifactId}.gz`;

      // Create a PassThrough stream to safely pipe the request body
      const bodyStream = new PassThrough();

      bodyStream.on("error", err => {
        console.error("Stream error:", err);
      });

      // Pipe the request (req, which is a readable stream) into the PassThrough stream
      req.pipe(bodyStream);

      try {
        const upload = new Upload({
          client,
          params: {
            Bucket: bucket,
            Key: filename,
            Body: bodyStream, // req is a readable stream
          },
        });
        await upload.done();
        return res.end();
      } catch (error) {
        return res.status(500).end();
      }
    }),
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

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
