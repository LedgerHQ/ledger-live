/** Interface for comparison configuration */
export interface ComparisonConfig {
  enabled: boolean;
  baselineRepo: string;
  baselineWorkflow: string;
  githubToken: string;
  applicationPlatform: string;
  applicationVersionName: string;
}
