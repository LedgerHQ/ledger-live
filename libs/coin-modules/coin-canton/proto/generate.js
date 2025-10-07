#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const protoDir = path.join(__dirname, ".");
const outputFile = path.join(__dirname, "../src/types/transaction-proto.json");

const RESERVED_WORDS = [
  { pattern: /\bbool bool\b/g, replacement: "bool bool_" },
  { pattern: /\bEnum enum\b/g, replacement: "Enum enum_" },
  { pattern: /\bstring constructor = (\d+);/g, replacement: "string constructor_ = $1;" },
];

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

async function main() {
  try {
    console.log("Generating protobuf bindings...");

    // Replace field names in proto files
    replaceReservedWords(path.join(protoDir, "com/daml/ledger/api/v2/value.proto"));
    replaceReservedWords(path.join(protoDir, "com/daml/ledger/api/v2/value_cb.proto"));

    // Generate protobuf bindings
    execSync(`npx pbjs -t json -w es6 --path ${protoDir} -o ${outputFile} ${protoDir}/device.proto`);

    console.log("Protobuf bindings generated successfully!");
  } catch (error) {
    console.error("Error generating protobuf bindings:", error.message);
    process.exit(1);
  }
}

main();
