// @flow

export type Incident = {
  created_at: string,
  id: string,
  impact: string,
  incident_updates: ?(IncidentUpdate[]),
  monitoring_at: ?string,
  name: string,
  page_id: ?string,
  resolved_at: ?string,
  shortlink: ?string,
  status: string,
  updated_at: ?string,
};

export type IncidentUpdate = {
  body: string,
  created_at?: string,
  display_at?: string,
  id?: string,
  incident_id?: string,
  status?: string,
  updated_at?: string,
};

export type State = {
  incidents: Incident[],
  isLoading: boolean,
  lastUpdateTime: ?number,
  error: ?Error,
};

export type ServiceStatusSummary = {
  incidents: ?(Incident[]),
};

export type ServiceStatusApi = {
  fetchStatusSummary: () => Promise<ServiceStatusSummary>,
};
