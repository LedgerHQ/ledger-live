use salvo::writing::Json;
use salvo::{Depot, Request, Response, Writer};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use async_trait::async_trait;
use salvo::http::{StatusCode, StatusError};
use salvo::oapi::{self, Components, EndpointOutRegister, Response as OpenApiResponse, ToSchema};
pub type AppResult<T> = std::result::Result<T, AppError>;

#[derive(Error, Debug)]
pub enum AppError {
  #[error("Internal server error: {0}")]
  InternalServerError(#[from] anyhow::Error),

  #[error("Bad request: {0}")]
  BadRequest(String),

  #[error("Invalid view key: {0}")]
  InvalidViewKey(String),

  #[error("Invalid transition details: {0}")]
  InvalidTransitionDetails(String),

  #[error("Decryption Error: {0}")]
  DecryptionError(String),

  #[error("Invalid ciphertext: {0}")]
  InvalidCiphertext(String),

  #[error("Invalid intent: {0}")]
  InvalidIntent(String),

  #[error("Invalid record: {0}")]
  InvalidRecord(String),

  #[error("Invalid signature: {0}")]
  InvalidSignature(String),

  #[error("Authorization failed: {0}")]
  AuthorizationFailed(String),
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ApiError {
  #[serde(rename = "type")]
  typ: String,
  code: u16,
  message: String,
}

#[async_trait]
impl Writer for AppError {
  async fn write(self, _req: &mut Request, _depot: &mut Depot, res: &mut Response) {
    let api_error = match self {
      AppError::InternalServerError(error) => ApiError {
        typ: "INTERNAL_SERVER_ERROR".to_string(),
        code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
        message: error.to_string(),
      },
      AppError::BadRequest(message) => ApiError {
        typ: "BAD_REQUEST".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::InvalidViewKey(message) => ApiError {
        typ: "INVALID_VIEW_KEY".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::InvalidCiphertext(message) => ApiError {
        typ: "INVALID_CIPHERTEXT".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::InvalidIntent(message) => ApiError {
        typ: "INVALID_INTENT".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::InvalidRecord(message) => ApiError {
        typ: "INVALID_RECORD".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::InvalidSignature(message) => ApiError {
        typ: "INVALID_SIGNATURE".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::AuthorizationFailed(message) => ApiError {
        typ: "AUTHORIZATION_FAILED".to_string(),
        code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
        message,
      },
      AppError::InvalidTransitionDetails(message) => ApiError {
        typ: "INVALID_TRANSITION_DETAILS".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
      AppError::DecryptionError(message) => ApiError {
        typ: "DECRYPTION_ERROR".to_string(),
        code: StatusCode::BAD_REQUEST.as_u16(),
        message,
      },
    };
    res.status_code(
      StatusCode::from_u16(api_error.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
    );
    res.render(Json(api_error));
  }
}

impl EndpointOutRegister for AppError {
  fn register(components: &mut Components, operation: &mut oapi::Operation) {
    operation.responses.insert(
      StatusCode::INTERNAL_SERVER_ERROR.as_str(),
      OpenApiResponse::new("Internal server error")
        .add_content("application/json", StatusError::to_schema(components)),
    );
    operation.responses.insert(
      StatusCode::NOT_FOUND.as_str(),
      OpenApiResponse::new("Not found")
        .add_content("application/json", StatusError::to_schema(components)),
    );
    operation.responses.insert(
      StatusCode::BAD_REQUEST.as_str(),
      OpenApiResponse::new("Bad request")
        .add_content("application/json", StatusError::to_schema(components)),
    );
  }
}
