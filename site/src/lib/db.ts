import { Pool } from "pg";

let db = new Pool({
	connectionString: process.env.DATABASE_URL,
});

export { db };
