use axum_extra::extract::cookie::{Cookie, SameSite};
use chrono::{Duration, Utc};
use deadpool_postgres::GenericClient;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use rand::{RngCore, rngs::OsRng};
use scrypt::{
    Scrypt,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
};
use uuid::Uuid;

use crate::{config::Config, error::AppError, models::Merchant};

pub const SESSION_COOKIE: &str = "astropay_session";

#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct Claims {
    sid: Uuid,
    sub: Uuid,
    exp: usize,
}

pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    Scrypt
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| AppError::Internal)
}

pub fn verify_password(password: &str, stored_hash: &str) -> bool {
    PasswordHash::new(stored_hash)
        .ok()
        .and_then(|parsed| Scrypt.verify_password(password.as_bytes(), &parsed).ok())
        .is_some()
}

pub fn generate_public_id() -> String {
    let mut bytes = [0u8; 8];
    OsRng.fill_bytes(&mut bytes);
    format!("inv_{}", hex::encode(bytes))
}

pub fn generate_memo() -> String {
    let mut bytes = [0u8; 6];
    OsRng.fill_bytes(&mut bytes);
    format!("astro_{}", hex::encode(bytes))
}

pub async fn create_session<C>(
    client: &C,
    config: &Config,
    merchant_id: Uuid,
) -> Result<Cookie<'static>, AppError>
where
    C: GenericClient + Sync,
{
    let row = client
        .query_one(
            "INSERT INTO sessions (merchant_id, expires_at) VALUES ($1, NOW() + interval '30 days') RETURNING id",
            &[&merchant_id],
        )
        .await?;
    let session_id: Uuid = row.get("id");
    let claims = Claims {
        sid: session_id,
        sub: merchant_id,
        exp: (Utc::now() + Duration::days(30)).timestamp() as usize,
    };
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.session_secret.as_bytes()),
    )?;
    Ok(session_cookie(config, token))
}

pub fn clear_session_cookie(config: &Config) -> Cookie<'static> {
    let mut cookie = session_cookie(config, String::new());
    cookie.make_removal();
    cookie
}

pub async fn current_merchant<C>(
    client: &C,
    config: &Config,
    token: Option<&str>,
) -> Result<Option<Merchant>, AppError>
where
    C: GenericClient + Sync,
{
    let Some(token) = token else {
        return Ok(None);
    };

    let decoded = match decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.session_secret.as_bytes()),
        &Validation::default(),
    ) {
        Ok(decoded) => decoded,
        Err(_) => return Ok(None),
    };

    let row = client
        .query_opt(
            "SELECT id, email, business_name, stellar_public_key, settlement_public_key, created_at
             FROM merchants
             WHERE id = $1
               AND EXISTS (
                 SELECT 1
                 FROM sessions
                 WHERE id = $2 AND merchant_id = $1 AND expires_at > NOW()
               )",
            &[&decoded.claims.sub, &decoded.claims.sid],
        )
        .await?;

    Ok(row.map(|row| Merchant::from_row(&row)))
}

fn session_cookie(config: &Config, token: String) -> Cookie<'static> {
    Cookie::build((SESSION_COOKIE, token))
        .path("/")
        .http_only(true)
        .secure(config.secure_cookies)
        .same_site(SameSite::Lax)
        .build()
}
