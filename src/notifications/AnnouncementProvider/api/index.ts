import type { AnnouncementsApi } from "../types";
import prodApi from "./api";

const api: AnnouncementsApi = {
  fetchAnnouncements: () => prodApi.fetchAnnouncements(),
};

export default api;
