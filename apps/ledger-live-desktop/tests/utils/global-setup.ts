import fs from "fs";
import { FullConfig } from "@playwright/test";
import { responseLogfilePath } from "./networkResponseLogger";

export default async function globalSetup(config: FullConfig) {
  if (responseLogfilePath) {
    fs.unlink(responseLogfilePath, error => {
      if (error) {
        console.log("Could not remove response.log file");
      }

      console.log("Previous response.log file removed");
    });
  }
}
