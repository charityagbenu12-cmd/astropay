use deadpool_postgres::{Manager, ManagerConfig, Pool, RecyclingMethod, Runtime};
use tokio_postgres::Config as PgConfig;

use crate::config::Config;

pub fn create_pool(config: &Config) -> anyhow::Result<Pool> {
    let pg = config.database_url.parse::<PgConfig>()?;
    let manager_config = ManagerConfig {
        recycling_method: RecyclingMethod::Fast,
    };
    let manager = Manager::from_config(pg, tokio_postgres::NoTls, manager_config);
    Ok(Pool::builder(manager)
        .runtime(Runtime::Tokio1)
        .max_size(16)
        .build()?)
}
