type Component = {
  id: string;
  name: string;
};

export type Incident = {
  created_at: string;
  id: string;
  impact: string;
  incident_updates: IncidentUpdate[] | null | undefined;
  monitoring_at: string | null | undefined;
  name: string;
  page_id: string | null | undefined;
  resolved_at: string | null | undefined;
  shortlink: string | null | undefined;
  status: string;
  updated_at: string | null | undefined;
  components?: Component[];
};
export type IncidentUpdate = {
  body: string;
  created_at?: string;
  display_at?: string;
  id?: string;
  incident_id?: string;
  status?: string;
  updated_at?: string;
  context?: ServiceStatusUserSettings;
};
export type State = {
  incidents: Incident[];
  isLoading: boolean;
  lastUpdateTime: number | null | undefined;
  error: Error | null | undefined;
  context?: ServiceStatusUserSettings;
};
export type ServiceStatusSummary = {
  incidents: Incident[] | null | undefined;
};
export type ServiceStatusApi = {
  fetchStatusSummary: () => Promise<ServiceStatusSummary>;
};

export type ServiceStatusUserSettings = {
  tickers: string[];
};
