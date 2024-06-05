import axios from "axios";
import fs from "fs";
import path from "path";

class XrayService {
  private static baseUrl = "https://xray.cloud.getxray.app/api/v2";
  private static token: string;

  private static async authenticate(): Promise<string> {
    const clientId = process.env.XRAY_CLIENT_ID;
    const clientSecret = process.env.XRAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing XRAY_CLIENT_ID or XRAY_CLIENT_SECRET environment variables");
    }

    const auth: Auth = {
      clientId,
      clientSecret,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/authenticate`, auth, {
        headers: { "Content-Type": "application/json" },
      });
      this.token = response.data["x-access-token"];
      return this.token;
    } catch (error) {
      console.error(`Error during authentication: ${error}`);
      throw error;
    }
  }

  public static async importExecution(xmlFilePath: string): Promise<ImportRes> {
    const projectKey = process.env.PROJECT_KEY;
    const testPlanKey = process.env.TEST_PLAN_KEY;
    if (!this.token) {
      await this.authenticate();
    }

    const xmlPayload = fs.readFileSync(path.resolve(xmlFilePath), "utf-8");

    try {
      const response = await axios.post(
        `${this.baseUrl}/import/execution/junit?projectKey=${projectKey}&testPlanKey=${testPlanKey}`,
        xmlPayload,
        {
          headers: {
            "Content-Type": "text/xml",
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (response.status === 200) {
        const responseData = response.data;
        console.info(`Test Results payload: ${xmlPayload}`);

        return {
          id: responseData.id,
          key: responseData.key,
          self: responseData.self,
        };
      } else {
        console.error(
          `Error during importExecution: Status: ${response.status}, Body: ${JSON.stringify(response.data)}, Payload: ${xmlPayload}`,
        );
        throw new Error(`Error during XrayService.importExecution()`);
      }
    } catch (error) {
      console.error(`Error during importExecution: ${error}`);
      throw error;
    }
  }
}

interface Auth {
  clientId: string;
  clientSecret: string;
}

interface ImportRes {
  id: string;
  key: string;
  self: string;
}

export default XrayService;

//todo: Que besoin de ce file ? les autres pas utile avec playwright mais je dois trouver comment faire le lien avec ce file, le test et playwright;config
