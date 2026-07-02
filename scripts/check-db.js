const { Pool } = require("pg");

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://stockflow:stockflow@localhost:5433/stockflow";

  const pool = new Pool({ connectionString });
  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("Connected to PostgreSQL");
    console.log(
      "Tables:",
      tables.rows.map((row) => row.table_name).join(", ")
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
