import axios from "axios";
import fs from "fs";

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
      client_id: clientId,
      client_secret: clientSecret,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/authenticate`, auth, {
        headers: { "Content-Type": "application/json" },
      });
      this.token = response.headers["x-access-token"];
      return this.token;
    } catch (error) {
      console.error(`Error during authentication: ${error}`);
      throw error;
    }
  }

  public static async importExecution(xmlFilePath: string): Promise<ImportRes> {
    if (!this.token) {
      await this.authenticate();
    }

    try {
      console.log(`Importing execution from XML file: ${xmlFilePath}`);
      const response = await axios.post(
        `${this.baseUrl}/import/execution/junit?projectKey=${process.env.PROJECT_KEY}&testPlanKey=${process.env.TEST_PLAN}`,
        fs.readFileSync(xmlFilePath, "utf-8"),
        {
          headers: {
            "Content-Type": "text/xml",
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (response.status === 200) {
        const responseData = response.data;
        console.log("Import successful, response data:", responseData);
        return {
          id: responseData.id,
          key: responseData.key,
          self: responseData.self,
        };
      } else {
        console.error("Error during XrayService.importExecution():", {
          status: response.status,
          data: response.data,
        });
        throw new Error(`Error during XrayService.importExecution(): Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error during importExecution: ${error}`);
      throw error;
    }
  }
}

interface Auth {
  client_id: string;
  client_secret: string;
}

interface ImportRes {
  id: string;
  key: string;
  self: string;
}

export default XrayService;
