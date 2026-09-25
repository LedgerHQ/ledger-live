use salvo::prelude::*;

use crate::ApiError;

#[derive(Debug, Clone, serde::Serialize, salvo::oapi::ToSchema)]
#[salvo(schema())]
pub struct HealthResponse {
  /// Service version
  pub version: String,
  /// Current service status
  pub status: String,
}

#[endpoint(
  operation_id = "get_health",
  tags("system"),
  summary = "Get system health",
  description = "Returns system health information",
  status_codes(200, 500),
  responses(
    (status_code = 200, description = "System health", body = HealthResponse),
    (status_code = 500, body = ApiError)
  )
)]
pub async fn handle_health(res: &mut Response) {
  res.render(Json(HealthResponse {
    version: env!("CARGO_PKG_VERSION").to_string(),
    status: "ok".to_string(),
  }));
}
