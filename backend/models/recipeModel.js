const { v4: uuidv4 } = require('uuid');

// Helper to format recipe properties from Neo4j record
const formatRecipe = (record) => {
    if (!record) return null;
    const recipe = record.get('r').properties;

    recipe.calories = Number(recipe.calories);
    recipe.protein = Number(recipe.protein);
    // NEW: Ensure 'private' property is a boolean from Neo4j's representation
    recipe.private = Boolean(recipe.private); 
    
    if (record.has('creatorId')) {
        recipe.creatorId = record.get('creatorId');
    }
    // Add dietaryType if present in the record (from the HAS_TYPE relationship)
    // This assumes the Cypher query returns 'd.name AS typeName'
    if (record.has('typeName')) {
        recipe.type = record.get('typeName');
    }
    return recipe;
};

// NEW FUNCTION: To get all dietary types (e.g., "Vegetarian", "Non-Vegetarian")
exports.getAllDietaryTypes = async (session) => {
    const result = await session.run(
        `
        MATCH (d:DietaryType)
        // Optionally, filter if you only want specific types like "Vegetarian" and "Non-Vegetarian"
        WHERE d.name IN ["Vegetarian", "Non-Vegetarian"] 
        RETURN d.name AS name
        ORDER BY d.name
        `
    );
    return result.records.map(record => record.toObject());
};


exports.create = async (session, recipeData, userId) => {
    const recipeId = uuidv4();
    // CHANGED: Destructure 'type' from recipeData and rename 'private' to 'isPrivate' for query parameters
    const { name, description, ingredients, steps, calories, protein, allergyInfo, private: isPrivate, type } = recipeData;

    // NEW: Server-side validation for the 'type' string
    if (!["Vegetarian", "Non-Vegetarian"].includes(type)) {
        throw new Error("Invalid recipe type. Must be 'Vegetarian' or 'Non-Vegetarian'.");
    }

    const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        // NEW: MERGE (find or create) the DietaryType node based on the 'type' provided
        MERGE (d:DietaryType {name: $type})
        CREATE (r:Recipe {
            id: $recipeId,
            name: $name,
            description: $description,
            ingredients: $ingredients,
            steps: $steps,
            calories: toInteger($calories),
            protein: toInteger($protein),
            allergyInfo: $allergyInfo,
            private: $isPrivate, // CHANGED: Use isPrivate from destructured data
            createdAt: timestamp(),
            updatedAt: timestamp()
        })
        CREATE (u)-[:CREATED]->(r)
        // NEW: Create the HAS_TYPE relationship between the Recipe and the DietaryType node
        CREATE (r)-[:HAS_TYPE]->(d)
        // CHANGED: Return d.name as typeName for formatRecipe to use
        RETURN r, d.name AS typeName
        `,
        // CHANGED: Pass 'isPrivate' and 'type' explicitly to the query parameters
        { userId, recipeId, name, description, ingredients, steps, calories, protein, allergyInfo, isPrivate, type }
    );
    return formatRecipe(result.records[0]);
};


exports.findAllByUserId = async (session, userId, typeFilter = null) => {
  let query = `
    MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe)
    OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
  `;

  if (typeFilter && typeFilter !== 'All') {
    query += `
      WITH r, u, d
      WHERE d.name = $typeFilter
    `;
  }

  query += `
    RETURN r, u.id AS creatorId, d.name AS typeName
    ORDER BY r.createdAt DESC
  `;

  const result = await session.run(query, { userId, typeFilter });
  return result.records.map(formatRecipe);
};



exports.findAll = async (session, typeFilter = null) => {
  let query = `
    MATCH (u:User)-[:CREATED]->(r:Recipe)
    OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
    WHERE r.private <> true
  `;

  if (typeFilter && typeFilter !== 'All') {
    query += `
      WITH r, u, d
      WHERE d.name = $typeFilter
    `;
  }

  query += `
    RETURN r, u.id AS creatorId, d.name AS typeName
    ORDER BY r.createdAt DESC
  `;

  const result = await session.run(query, { typeFilter });
  return result.records.map(formatRecipe);
};



exports.findByIdAndUser = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        // NEW: OPTIONAL MATCH to fetch the related DietaryType node if it exists
        OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
        // CHANGED: Return d.name as typeName along with recipe
        RETURN r, d.name AS typeName
        `,
        { userId, recipeId }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};

exports.findRecipeByNameAndUser = async (session, name, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {name: $name})
        // NEW: OPTIONAL MATCH to fetch the related DietaryType node if it exists
        OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
        // CHANGED: Return d.name as typeName along with recipe
        RETURN r, d.name AS typeName
        `,
        { name, userId }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};





exports.update = async (session, recipeId, recipeData, userId) => {
    // CHANGED: Destructure 'type' from recipeData and rename 'private' to 'isPrivate' for query parameters
    const { name, description, ingredients, steps, calories, protein, allergyInfo, private: isPrivate, type } = recipeData;

    // NEW: Server-side validation for the 'type' string
    if (!["Vegetarian", "Non-Vegetarian"].includes(type)) {
        throw new Error("Invalid recipe type. Must be 'Vegetarian' or 'Non-Vegetarian'.");
    }

    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[c:CREATED]->(r:Recipe {id: $recipeId})
        // NEW: OPTIONAL MATCH and DELETE any existing HAS_TYPE relationships for this recipe
        OPTIONAL MATCH (r)-[oldRel:HAS_TYPE]->(:DietaryType)
        DELETE oldRel
        WITH r, u, c // NEW: Pass matched variables to the next clause after DELETE

        // NEW: MERGE (find or create) the new DietaryType node based on the 'type' provided
        MERGE (d:DietaryType {name: $type})
        
        // NEW: Create the new HAS_TYPE relationship between the Recipe and the (new) DietaryType node
        CREATE (r)-[:HAS_TYPE]->(d)

        SET r += {
            name: $name,
            description: $description,
            ingredients: $ingredients,
            steps: $steps,
            calories: toInteger($calories),
            protein: toInteger($protein),
            private: $isPrivate, // CHANGED: Use isPrivate from destructured data
            allergyInfo: $allergyInfo,
            updatedAt: datetime()
        },c.isCreatedBy = "deepak" // Note: Consider if 'isCreatedBy' should be dynamic or removed
        // CHANGED: Return d.name as typeName for formatRecipe
        RETURN r, d.name AS typeName
        `,
        // CHANGED: Pass 'isPrivate' and 'type' explicitly to the query parameters
        { userId, recipeId, name, description, ingredients, steps, calories, protein, allergyInfo, isPrivate, type }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};


exports.deleteById = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        DETACH DELETE r // DETACH DELETE removes the node and all its relationships (including HAS_TYPE)
        RETURN count(r) as deletedCount
        `,
        { userId, recipeId }
    );
    return result.records[0].get('deletedCount');
};