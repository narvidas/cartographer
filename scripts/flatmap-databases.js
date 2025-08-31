// flatmap-databases.js
// Usage: node scripts/flatmap-databases.js
// This script reads public/systems.json, flat-maps database_servers into a new databases array, and writes the result back.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../public/systems.json");

function toTitleCase(str) {
  return str.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function flatMapDatabases(json) {
  const servers = json.database_servers || [];
  const databases = [];
  for (const server of servers) {
    if (Array.isArray(server.databases)) {
      for (const dbName of server.databases) {
        // Create a unique ID by combining database name and server ID
        const uniqueId = `${dbName}-${server.id}`;

        // Get all server properties except 'databases' and 'id'
        const serverProperties = Object.fromEntries(
          Object.entries(server).filter(([k]) => k !== "databases" && k !== "id"),
        );

        databases.push({
          id: uniqueId, // This should be unique for each database
          alias: toTitleCase(dbName),
          name: dbName,
          database_server_name: server.name,
          database_server: server.id,
          ...serverProperties,
        });
      }
    }
  }
  return databases;
}

// Helper to read and flatmap servers from a file
function flatmapServersFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!Array.isArray(data.servers)) return [];
  // Flatmap: for each server, create a database entry for each database in its 'databases' array
  return data.servers.flatMap((server) =>
    server.databases && server.databases.length > 0
      ? server.databases.map((db) => ({
          ...server,
          database: db,
        }))
      : [{ ...server }],
  );
}

// Main logic
const systemMapPath = path.join(__dirname, "../public/systems.json");
const homeServersPath = path.join(os.homedir(), "hqdb-servers.json");

// Read and flatmap from systems.json (if needed, adapt to your structure)
let systemMap = JSON.parse(fs.readFileSync(systemMapPath, "utf-8"));
let flatmappedDatabases = [];

// If your systemMap has a 'database_servers' or similar, flatmap those
if (Array.isArray(systemMap.database_servers)) {
  flatmappedDatabases = systemMap.database_servers.flatMap((server) =>
    server.databases && server.databases.length > 0
      ? server.databases.map((db) => ({
          ...server,
          database: db,
        }))
      : [{ ...server }],
  );
}

// Flatmap from ~/hqdb-servers.json
const homeFlatmapped = flatmapServersFromFile(homeServersPath);

// Merge both sources
const allDatabases = [...flatmappedDatabases, ...homeFlatmapped];

// You can now write this merged array back to systemMap, or wherever you need
// For example, add/replace a 'databases' property:
systemMap.databases = allDatabases;

// Write back to systems.json
fs.writeFileSync(systemMapPath, JSON.stringify(systemMap, null, 2));
console.log(
  `Flatmapped ${flatmappedDatabases.length} databases from systems.json and ${homeFlatmapped.length} from ~/hqdb-servers.json.`,
);

function main() {
  const raw = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(raw);
  json.databases = flatMapDatabases(json);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
  console.log("Flat-mapped databases array written to public/systems.json");
}

main();
