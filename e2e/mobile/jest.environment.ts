import { log } from "detox";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { takeSpeculosScreenshot } from "./utils/speculosUtils";
import { Circus } from "@jest/types";
import { logMemoryUsage } from "./helpers/commonHelpers";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalkImport = require("chalk");
const chalk = chalkImport.default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glob = require("glob");

// pull in the Detox base env (this is a CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DetoxEnvironment = require("detox/runners/jest/testEnvironment");

const trackerFilePath = path.resolve(__dirname, "test-tracker.json");

function cleanupTracker() {
  try {
    if (fsSync.existsSync(trackerFilePath)) {
      fsSync.unlinkSync(trackerFilePath);
      log.info("🧹 test-tracker.json cleaned up (on signal)");
    }
  } catch (error) {
    log.warn("Failed to clean up test-tracker.json:", error);
  }
}

process.once("SIGINT", cleanupTracker);
process.once("SIGTERM", cleanupTracker);
process.once("exit", cleanupTracker);

function readTestTracker(): { testCount: number } {
  try {
    if (fsSync.existsSync(trackerFilePath)) {
      return JSON.parse(fsSync.readFileSync(trackerFilePath, "utf-8"));
    }
  } catch (error) {
    log.error("Error reading test tracker:", error);
  }
  return { testCount: 0 };
}

function writeTestTracker(data: { testCount: number }) {
  fsSync.writeFileSync(trackerFilePath, JSON.stringify(data), "utf-8");
}

class TestEnvironment extends DetoxEnvironment {
  totalTests = 0;
  totalDescribes = 0;
  specFilesCount = 0;

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    await super.handleTestEvent(event, state);

    if (event.name === "run_start") {
      const { totalTests, totalDescribes, specFilesCount } = await this.countTestsAndDescribes();
      this.totalTests = totalTests;
      this.totalDescribes = totalDescribes;
      this.specFilesCount = specFilesCount;

      const tracker = readTestTracker();
      const testCount = tracker?.testCount ?? 0;

      writeTestTracker({ testCount });

      log.info(chalk.bold.cyan(`\n🧪  TEST ENVIRONMENT SUMMARY`));
      log.info(chalk.blueBright(`┌────────────────────────────────────────┐`));
      log.info(
        chalk.blueBright(
          `│  📄 Spec files      : ${chalk.yellow(specFilesCount.toString().padStart(3))}              │`,
        ),
      );
      log.info(
        chalk.blueBright(
          `│  📦 Describe blocks : ${chalk.yellow(totalDescribes.toString().padStart(3))}              │`,
        ),
      );
      log.info(
        chalk.blueBright(
          `│  ✅ Test blocks     : ${chalk.yellow(totalTests.toString().padStart(3))}               │`,
        ),
      );
      log.info(chalk.blueBright(`└────────────────────────────────────────┘\n`));
      log.info(
        chalk.greenBright(
          `🚀 Starting test run — Progress: ${chalk.bold(`${testCount}/${totalTests}`)} executed`,
        ),
      );

      await logMemoryUsage();
    }

    if (event.name === "test_start") {
      const tracker = readTestTracker();
      const testCount = tracker.testCount + 1;
      writeTestTracker({ testCount });
      log.info(
        chalk.magentaBright(
          `🔸 Executing test ${chalk.bold(`${testCount}`)} of ${chalk.bold(`${this.totalTests}`)}`,
        ),
      );
    }

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }

    if (this.global.IS_FAILED && ["test_fn_start", "test_fn_failure"].includes(event.name)) {
      await takeSpeculosScreenshot();
    }
  }

  async countTestsAndDescribes(): Promise<{
    totalTests: number;
    totalDescribes: number;
    specFilesCount: number;
  }> {
    try {
      const args = process.argv.slice(2).filter(a => a.includes("specs/"));
      const inputs = args.length ? args : ["specs/**/*.spec.ts"];

      const specFiles = inputs
        .flatMap(arg => glob.sync(arg.includes("*") ? arg : path.resolve(arg), { absolute: true }))
        .filter(f => f.endsWith(".spec.ts"));

      let totalTests = 0;
      let totalDescribes = 0;

      const testRe = /(it|test)(\.(skip|only))?\s*\(\s*["'`][^"'`]+["'`]/g;
      const describeRe = /describe(\.(skip|only))?\s*\(\s*["'`][^"'`]+["'`]/g;
      const forLoopRe =
        /for\s*\(\s*const\s+\w+\s+of\s+(\w+)\s*\)\s*{[^}]*verifyLanguageCanBeChanged/g;

      for (const spec of specFiles) {
        const specSrc = await fs.readFile(spec, "utf8");

        // Count static test and describe blocks
        const testMatches = specSrc.match(testRe) || [];
        const describeMatches = specSrc.match(describeRe) || [];
        totalTests += testMatches.length;
        totalDescribes += describeMatches.length;

        // Detect dynamic tests from for loops calling verifyLanguageCanBeChanged
        const forLoopMatches = specSrc.matchAll(forLoopRe);
        for (const match of forLoopMatches) {
          const arrayName = match[1]; // e.g., langButtonText
          // Look for the array definition in the spec file
          const arrayDefRe = new RegExp(`const\\s+${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "g");
          const arrayDefMatch = specSrc.match(arrayDefRe);
          if (arrayDefMatch) {
            // Count the number of elements in the array (approximate by counting objects)
            const arrayContent = arrayDefMatch[0].match(/{[^}]+}/g);
            if (arrayContent) {
              totalTests += arrayContent.length; // Add one test per array element
            }
          }
        }

        // Optionally, scan imported or local .ts files for functions containing tests
        const calledFns = [...specSrc.matchAll(/(\w+)\((.*?)\)/g)].map(match => match[1]);
        const dir = path.dirname(spec);
        const baseFiles = glob
          .sync(path.join(dir, "*.ts"))
          .filter((f: string) => !f.endsWith(".spec.ts"));

        for (const file of baseFiles) {
          const src = await fs.readFile(file, "utf8");
          for (const fn of calledFns) {
            const fnBodyMatch = new RegExp(
              `function\\s+${fn}\\s*\\([^)]*\\)\\s*{([\\s\\S]*?)^}`,
              "gm",
            );
            const fnBodies = [...src.matchAll(fnBodyMatch)];
            for (const [, body] of fnBodies) {
              totalTests += (body.match(testRe) || []).length;
              totalDescribes += (body.match(describeRe) || []).length;
            }
          }
        }
      }

      return {
        totalTests,
        totalDescribes,
        specFilesCount: specFiles.length,
      };
    } catch (error) {
      log.error("Error counting tests and describes:", error);
      return {
        totalTests: 0,
        totalDescribes: 0,
        specFilesCount: 0,
      };
    }
  }
}

module.exports = TestEnvironment;
