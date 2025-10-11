#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const outputFile = path.join(__dirname, "../src/types/transaction-proto.json");
const tempDir = path.join(__dirname, "temp-proto");

const APP_CANTON_REPO = "LedgerHQ/app-canton";
const APP_CANTON_BRANCH = "develop";
const APP_CANTON_BASE_URL = `https://raw.githubusercontent.com/${APP_CANTON_REPO}/${APP_CANTON_BRANCH}`;

const DAML_REPO = "digital-asset/daml";
const DAML_BRANCH = "main";
const DAML_BASE_URL = `https://raw.githubusercontent.com/${DAML_REPO}/${DAML_BRANCH}`;

const RESERVED_WORDS = [
  { pattern: /\bbool bool\b/g, replacement: "bool bool_" },
  { pattern: /\bEnum enum\b/g, replacement: "Enum enum_" },
  { pattern: /\bstring constructor = (\d+);/g, replacement: "string constructor_ = $1;" },
];

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https
      .get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });

        file.on("error", err => {
          fs.unlink(filePath, () => { });
          reject(err);
        });
      })
      .on("error", err => {
        reject(err);
      });
  });
}

async function downloadProtoFiles() {
  console.log("Downloading proto files from...");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const protoFiles = [
    {
      repoPath: "proto/device.proto",
      localPath: "device.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/com/daml/ledger/api/v2/value.proto",
      localPath: "com/daml/ledger/api/v2/value.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/com/daml/ledger/api/v2/value_cb.proto",
      localPath: "com/daml/ledger/api/v2/value_cb.proto",
      source: "app-canton",
    },
    {
      repoPath: "sdk/canton/community/ledger-api/src/main/protobuf/com/daml/ledger/api/v2/interactive/interactive_submission_common_data.proto",
      localPath: "com/daml/ledger/api/v2/interactive/interactive_submission_common_data.proto",
      source: "daml",
    },
    {
      repoPath:
        "sdk/canton/community/ledger-api/src/main/protobuf/com/daml/ledger/api/v2/interactive/transaction/v1/interactive_submission_data.proto",
      localPath:
        "com/daml/ledger/api/v2/interactive/transaction/v1/interactive_submission_data.proto",
      source: "daml",
    },
    {
      repoPath: "proto/interactive_submission_data_cb.proto",
      localPath:
        "com/daml/ledger/api/v2/interactive/transaction/v1/interactive_submission_data_cb.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/protobuf/any.proto",
      localPath: "google/protobuf/any.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/protobuf/duration.proto",
      localPath: "google/protobuf/duration.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/protobuf/empty.proto",
      localPath: "google/protobuf/empty.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/protobuf/timestamp.proto",
      localPath: "google/protobuf/timestamp.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/rpc/error_details.proto",
      localPath: "google/rpc/error_details.proto",
      source: "app-canton",
    },
    {
      repoPath: "proto/google/rpc/status.proto",
      localPath: "google/rpc/status.proto",
      source: "app-canton",
    },
  ];

  // Download each proto file
  for (const protoFile of protoFiles) {
    const baseUrl = protoFile.source === "daml" ? DAML_BASE_URL : APP_CANTON_BASE_URL;
    const url = `${baseUrl}/${protoFile.repoPath}`;
    const localPath = path.join(tempDir, protoFile.localPath);

    // Create directory structure
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      await downloadFile(url, localPath);
      console.log(`Downloaded: ${protoFile.localPath}`);
    } catch (error) {
      console.error(`Failed to download ${protoFile.localPath}:`, error.message);
      throw error;
    }
  }

  console.log("All proto files downloaded successfully!");
}

// Replace reserved words to make sure only C allowed names are used
// see https://github.com/LedgerHQ/app-canton/blob/develop/proto/proto_gen.sh#L257
function replaceReservedWords(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, "utf8");

  RESERVED_WORDS.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated field names in ${path.basename(filePath)}`);
}

// Clean up temp directory
function cleanup() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("Cleaned up temporary files");
  }
}

async function main() {
  try {
    console.log("Generating protobuf bindings...");

    await downloadProtoFiles();

    // Replace field names in proto files
    replaceReservedWords(path.join(tempDir, "com/daml/ledger/api/v2/value.proto"));
    replaceReservedWords(path.join(tempDir, "com/daml/ledger/api/v2/value_cb.proto"));

    // Generate protobuf bindings
    execSync(`npx pbjs -t json -w es6 --path ${tempDir} -o ${outputFile} ${tempDir}/device.proto`);

    console.log("Protobuf bindings generated successfully!");
  } catch (error) {
    console.error("Error generating protobuf bindings:", error.message);
    process.exit(1);
  } finally {
    // Clean up temporary files
    cleanup();
  }
}

main();
