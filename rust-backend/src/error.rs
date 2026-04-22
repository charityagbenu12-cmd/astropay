use axum::{
    Json,
    http::{HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
};
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),
    #[error("{0}")]
    Unauthorized(String),
    #[error("Too many login attempts")]
    RateLimited {
        retry_after_seconds: u64,
    },
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    Conflict(String),
    #[error("{0}")]
    NotImplemented(String),
    #[error("Internal server error")]
    Internal,
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

#[derive(Serialize)]
struct RateLimitedBody {
    error: RateLimitedInner,
}

#[derive(Serialize)]
struct RateLimitedInner {
    code: &'static str,
    message: String,
    #[serde(rename = "retryAfterSeconds")]
    retry_after_seconds: u64,
}

impl AppError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self::Unauthorized(message.into())
    }

    pub fn rate_limited(retry_after_seconds: u64) -> Self {
        Self::RateLimited {
            retry_after_seconds,
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::NotFound(message.into())
    }

    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    pub fn not_implemented(message: impl Into<String>) -> Self {
        Self::NotImplemented(message.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            Self::RateLimited {
                retry_after_seconds,
            } => {
                let body = RateLimitedBody {
                    error: RateLimitedInner {
                        code: "AUTH_RATE_LIMITED",
                        message: "Too many login attempts. Please wait before trying again."
                            .to_string(),
                        retry_after_seconds,
                    },
                };
                let mut res = (StatusCode::TOO_MANY_REQUESTS, Json(body)).into_response();
                if let Ok(h) = HeaderValue::from_str(&retry_after_seconds.to_string()) {
                    res.headers_mut().insert(header::RETRY_AFTER, h);
                }
                res
            }
            Self::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorBody { error: message }),
            )
                .into_response(),
            Self::Unauthorized(message) => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorBody { error: message }),
            )
                .into_response(),
            Self::NotFound(message) => (
                StatusCode::NOT_FOUND,
                Json(ErrorBody { error: message }),
            )
                .into_response(),
            Self::Conflict(message) => (
                StatusCode::CONFLICT,
                Json(ErrorBody { error: message }),
            )
                .into_response(),
            Self::NotImplemented(message) => (
                StatusCode::NOT_IMPLEMENTED,
                Json(ErrorBody { error: message }),
            )
                .into_response(),
            Self::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorBody {
                    error: "Unexpected error".to_string(),
                }),
            )
                .into_response(),
        }
    }
}

impl From<tokio_postgres::Error> for AppError {
    fn from(_: tokio_postgres::Error) -> Self {
        Self::Internal
    }
}

impl From<deadpool_postgres::PoolError> for AppError {
    fn from(_: deadpool_postgres::PoolError) -> Self {
        Self::Internal
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        Self::Unauthorized("Unauthorized".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{RateLimitedBody, RateLimitedInner};

    #[test]
    fn rate_limited_json_uses_auth_rate_limited_code() {
        let body = RateLimitedBody {
            error: RateLimitedInner {
                code: "AUTH_RATE_LIMITED",
                message: "Too many login attempts. Please wait before trying again.".to_string(),
                retry_after_seconds: 42,
            },
        };
        let v = serde_json::to_value(&body).unwrap();
        assert_eq!(v["error"]["code"], "AUTH_RATE_LIMITED");
        assert_eq!(v["error"]["retryAfterSeconds"], 42);
    }
}
