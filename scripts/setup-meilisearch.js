import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This script sets up Meilisearch indexes with your systems.json data
// Run this after starting Meilisearch with docker-compose up

const MEILISEARCH_URL = process.env.MEILISEARCH_URL || "http://localhost:7700";
const MASTER_KEY = "change_this_in_production";

async function setupMeilisearch() {
  try {
    // Read the systems.json file
    const dataPath = path.join(__dirname, "../public/systems.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    console.log("Setting up Meilisearch indexes...");

    // Validate primary keys for uniqueness
    console.log("🔍 Validating primary keys...");
    validatePrimaryKeys("services", data.services, "id");
    validatePrimaryKeys("contexts", data.contexts, "id");
    validatePrimaryKeys("databases", data.databases, "id");
    validatePrimaryKeys("external", data.external, "id");

    // Create services index (uses 'id' as primary key)
    await createIndex("services", data.services, "id");

    // Create contexts index (uses 'id' as primary key)
    await createIndex("contexts", data.contexts, "id");

    // Create databases index (uses 'id' as primary key)
    await createIndex("databases", data.databases, "id");

    // Create external systems index (uses 'id' as primary key)
    await createIndex("external", data.external, "id");

    // Create a search-only API key
    await createSearchKey();

    console.log("✅ Meilisearch setup complete!");
    console.log("You can now search your system map data.");
  } catch (error) {
    console.error("❌ Error setting up Meilisearch:", error.message);
  }
}

function validatePrimaryKeys(indexName, documents, primaryKeyField) {
  const primaryKeys = documents.map((doc) => doc[primaryKeyField]).filter(Boolean);
  const uniqueKeys = new Set(primaryKeys);

  if (primaryKeys.length !== uniqueKeys.size) {
    const duplicates = primaryKeys.filter((key, index) => primaryKeys.indexOf(key) !== index);
    console.warn(`⚠️ Warning: Duplicate primary keys found in ${indexName}:`, [...new Set(duplicates)]);
  } else {
    console.log(`✅ ${indexName}: All primary keys are unique (${primaryKeys.length} documents)`);
  }
}

async function createIndex(indexName, documents, primaryKey) {
  const indexUrl = `${MEILISEARCH_URL}/indexes/${indexName}`;

  // Create index
  const createResponse = await fetch(indexUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MASTER_KEY}`,
    },
    body: JSON.stringify({
      primaryKey: primaryKey,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    console.log(`Index ${indexName} might already exist: ${error}`);
  } else {
    console.log(`✅ Created index: ${indexName}`);
  }

  // Add documents
  const documentsUrl = `${indexUrl}/documents`;
  console.log(`📝 Adding ${documents.length} documents to ${indexName}...`);

  const addResponse = await fetch(documentsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MASTER_KEY}`,
    },
    body: JSON.stringify(documents),
  });

  if (addResponse.ok) {
    const result = await addResponse.json();
    console.log(`✅ Added ${documents.length} documents to ${indexName}`);
    console.log(`🔄 Task UID: ${result.taskUid}`);

    // Wait for indexing to complete
    await waitForTask(result.taskUid);

    // Configure searchable attributes for the index
    await configureSearchableAttributes(indexName);
  } else {
    const errorText = await addResponse.text();
    console.error(`❌ Failed to add documents to ${indexName}:`, errorText);
    throw new Error(`Failed to add documents to ${indexName}: ${errorText}`);
  }
}

async function waitForTask(taskUid) {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${MEILISEARCH_URL}/tasks/${taskUid}`, {
      headers: {
        Authorization: `Bearer ${MASTER_KEY}`,
      },
    });

    if (response.ok) {
      const task = await response.json();

      if (task.status === "succeeded") {
        return;
      } else if (task.status === "failed") {
        const errorDetails = task.error ? JSON.stringify(task.error, null, 2) : "Unknown error";
        throw new Error(`Task failed: ${errorDetails}`);
      }
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Task timeout");
}

async function createSearchKey() {
  try {
    const response = await fetch(`${MEILISEARCH_URL}/keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MASTER_KEY}`,
      },
      body: JSON.stringify({
        name: "search-key",
        description: "Search-only key for system map frontend",
        actions: ["search"],
        indexes: ["services", "contexts", "databases", "external"],
        expiresAt: null, // Never expires
      }),
    });

    if (response.ok) {
      const keyData = await response.json();
      console.log("✅ Created search-only API key");
      console.log("🔑 Search Key:", keyData.key);
      console.log("📝 Add this key to your .env file as MEILISEARCH_SEARCH_KEY");

      // Save the key to a .env file for easy access
      const envContent = `MEILISEARCH_SEARCH_KEY=${keyData.key}\n`;
      fs.writeFileSync(path.join(__dirname, "../.env"), envContent);
      console.log("💾 Saved search key to .env file");
    } else {
      console.log("⚠️ Could not create search key (might already exist)");
    }
  } catch (error) {
    console.log("⚠️ Could not create search key:", error.message);
  }
}

async function configureSearchableAttributes(indexName) {
  const settingsUrl = `${MEILISEARCH_URL}/indexes/${indexName}/settings/searchable-attributes`;

  // Define searchable attributes based on index type
  let searchableAttributes = ["name", "description", "alias"];

  if (indexName === "services") {
    searchableAttributes = [
      "name",
      "description",
      "alias",
      "endpoints",
      "eventsPublished",
      "eventsConsumed",
      "context",
      "language",
      "size",
      "use_cases",
      "integrates_with",
    ];
  } else if (indexName === "external") {
    searchableAttributes = ["name", "description", "alias", "endpoints", "type"];
  }

  try {
    const response = await fetch(settingsUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MASTER_KEY}`,
      },
      body: JSON.stringify(searchableAttributes),
    });

    if (response.ok) {
      console.log(`✅ Configured searchable attributes for ${indexName}:`, searchableAttributes);
    } else {
      const error = await response.text();
      console.warn(`⚠️ Could not configure searchable attributes for ${indexName}:`, error);
    }
  } catch (error) {
    console.warn(`⚠️ Error configuring searchable attributes for ${indexName}:`, error.message);
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMeilisearch();
}

export { setupMeilisearch };
