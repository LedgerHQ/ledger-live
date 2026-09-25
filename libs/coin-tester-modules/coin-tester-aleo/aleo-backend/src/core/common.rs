use crate::{AppError, AppResult};
use std::fmt::Display;
use std::str::FromStr;

pub fn parse_string<T>(value: &str) -> AppResult<T>
where
  T: FromStr,
  T::Err: Display,
{
  value
    .parse::<T>()
    .map_err(|e| AppError::InvalidIntent(format!("Invalid value: '{}': {}", value, e)))
}
