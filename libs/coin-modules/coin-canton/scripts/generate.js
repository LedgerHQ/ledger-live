#!/usr/bin/env node
/* eslint @typescript-eslint/no-var-requires: off */
/* eslint no-console: off */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function handleFileFinish(file, resolve) {
  file.close();
  resolve();
}

function handleFileError(filePath, reject) {
  return err => {
    fs.unlink(filePath, () => {
      /* empty function */
    });
    reject(err);
  };
}

function handleHttpResponse(url, file, filePath, resolve, reject) {
  return response => {
    if (response.statusCode !== 200) {
      reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      return;
    }

    response.pipe(file);

    file.on("finish", () => handleFileFinish(file, resolve));
    file.on("error", handleFileError(filePath, reject));
  };
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(url, handleHttpResponse(url, file, filePath, resolve, reject)).on("error", err => {
      reject(err instanceof Error ? err : new Error(err));
    });
  });
}

const PROTO_FILES = [
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
    repoPath:
      "sdk/canton/community/ledger-api/src/main/protobuf/com/daml/ledger/api/v2/interactive/interactive_submission_common_data.proto",
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

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getDownloadUrl(protoFile) {
  const baseUrl = protoFile.source === "daml" ? DAML_BASE_URL : APP_CANTON_BASE_URL;
  return `${baseUrl}/${protoFile.repoPath}`;
}

async function downloadProtoFile(protoFile) {
  const url = getDownloadUrl(protoFile);
  const localPath = path.join(tempDir, protoFile.localPath);

  ensureDirectoryExists(path.dirname(localPath));

  try {
    await downloadFile(url, localPath);
    console.log(`Downloaded: ${protoFile.localPath}`);
  } catch (error) {
    console.error(`Failed to download ${protoFile.localPath}:`, error.message);
    throw error;
  }
}

async function downloadProtoFiles() {
  console.log("Downloading proto files from...");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (const protoFile of PROTO_FILES) {
    await downloadProtoFile(protoFile);
  }

  console.log("All proto files downloaded successfully!");
}

// Replace reserved words to make sure only C allowed names are used
// see https://github.com/LedgerHQ/app-canton/blob/develop/proto/proto_gen.sh#L257
function replaceReservedWords(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, "utf8");

  for (const { pattern, replacement } of RESERVED_WORDS) {
    content = content.replace(pattern, replacement);
  }

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

function processProtoFiles() {
  // Replace field names in proto files
  replaceReservedWords(path.join(tempDir, "com/daml/ledger/api/v2/value.proto"));
  replaceReservedWords(path.join(tempDir, "com/daml/ledger/api/v2/value_cb.proto"));
}

function generateProtobufBindings() {
  // Sanitize paths to prevent command injection
  const sanitizedTempDir = path.resolve(tempDir);
  const sanitizedOutputFile = path.resolve(outputFile);
  const deviceProtoPath = path.join(sanitizedTempDir, "device.proto");

  // Validate that paths exist and are within expected directories
  if (!fs.existsSync(deviceProtoPath)) {
    throw new Error(`Device proto file not found: ${deviceProtoPath}`);
  }

  if (!sanitizedTempDir.startsWith(path.resolve(__dirname))) {
    throw new Error("Invalid temp directory path");
  }

  if (!sanitizedOutputFile.startsWith(path.resolve(__dirname, ".."))) {
    throw new Error("Invalid output file path");
  }

  // Use npx from the same Node.js installation directory to avoid PATH manipulation
  const npxPath = path.join(process.execPath, "..", "npx");
  const absoluteNpxPath = path.resolve(npxPath);

  execSync(
    absoluteNpxPath,
    [
      "pbjs",
      "-t",
      "json",
      "-w",
      "es6",
      "--path",
      sanitizedTempDir,
      "-o",
      sanitizedOutputFile,
      deviceProtoPath,
    ],
    {
      stdio: "inherit",
      cwd: __dirname,
    },
  );
}

try {
  console.log("Generating protobuf bindings...");

  await downloadProtoFiles();
  processProtoFiles();
  generateProtobufBindings();

  console.log("Protobuf bindings generated successfully!");
} catch (error) {
  console.error("Error generating protobuf bindings:", error.message);
  process.exit(1);
} finally {
  cleanup();
}
