/**
 * Monorepo kökünden veya `server` klasöründen başlatıldığında bile
 * her zaman server/.env yüklensin (DATABASE_URL vb.).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(serverRoot, ".env") });
