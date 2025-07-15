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

    // NEW: Add ingredients if present in the record (from the HAS_INGREDIENT relationship)
    // This assumes the Cypher query returns 'collect(i.name) AS ingredients'
    if (record.has('ingredients')) {
        recipe.ingredients = record.get('ingredients');
    } else {
        recipe.ingredients = []; // Ensure it's always an array, even if empty
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

// added 2025-07-14
// NEW FUNCTION: To fetch all available ingredient names from Neo4j
exports.getAllIngredients = async (session) => {
  const result = await session.run(`
    MATCH (i:Ingredient)
    RETURN i.name AS name
    ORDER BY i.name
  `);
  return result.records.map(record => record.get('name'));
};



exports.create = async (session, recipeData, userId) => {
  const recipeId = uuidv4();
  const { name, description, ingredients, steps, calories, protein, allergyInfo, private: isPrivate, type } = recipeData;

  if (!["Vegetarian", "Non-Vegetarian"].includes(type)) {
    throw new Error("Invalid recipe type. Must be 'Vegetarian' or 'Non-Vegetarian'.");
  }

  const result = await session.run(
    `
    MATCH (u:User {id: $userId})
    MERGE (d:DietaryType {name: $type})
    CREATE (r:Recipe {
        id: $recipeId,
        name: $name,
        description: $description,
        steps: $steps,
        calories: toInteger($calories),
        protein: toInteger($protein),
        allergyInfo: $allergyInfo,
        private: $isPrivate,
        createdAt: timestamp(),
        updatedAt: timestamp()
    })
    CREATE (u)-[:CREATED]->(r)
    CREATE (r)-[:HAS_TYPE]->(d)
    RETURN r, d.name AS typeName
    `,
    { userId, recipeId, name, description, steps, calories, protein, allergyInfo, isPrivate, type }
  );

  // Check if recipe was actually created
  if (result.records.length === 0) {
    throw new Error("Failed to create recipe. User might not exist or another issue occurred.");
  }

  // added 2025-07-14: create HAS_INGREDIENT relationships after recipe node creation
  if (ingredients && ingredients.length > 0) {
    for (const ing of ingredients) {
      await session.run(
        `
        MERGE (i:Ingredient {name: $ing}) // Ensure ingredient node exists
        WITH i
        MATCH (r:Recipe {id: $recipeId})
        MERGE (r)-[:HAS_INGREDIENT]->(i) // Create relationship
        `,
        { recipeId, ing }
      );
    }
  }

  return formatRecipe(result.records[0]);
};



exports.findAllByUserId = async (session, userId, typeFilter = null) => {
  let query = `
    MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe)
    OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
    OPTIONAL MATCH (r)-[:HAS_INGREDIENT]->(i:Ingredient) // NEW: Match ingredients
  `;

  if (typeFilter && typeFilter !== 'All') {
    query += `
      WITH r, u, d, i // Ensure 'i' is carried forward
      WHERE d.name = $typeFilter
    `;
  }

  query += `
    RETURN r, u.id AS creatorId, d.name AS typeName, collect(i.name) AS ingredients // NEW: Collect ingredient names
    ORDER BY r.createdAt DESC
  `;

  const result = await session.run(query, { userId, typeFilter });
  return result.records.map(formatRecipe);
};




exports.findAll = async (session, typeFilter = null) => {
  let query = `
    MATCH (u:User)-[:CREATED]->(r:Recipe)
    WHERE r.private = false
    OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
    OPTIONAL MATCH (r)-[:HAS_INGREDIENT]->(i:Ingredient)
  `;

  // Conditionally add type filter via WITH + WHERE
  if (typeFilter && typeFilter !== 'All') {
    query += `
      WITH r, u, d, i
      WHERE d.name = $typeFilter
    `;
  } else {
    // If no typeFilter, still pass variables through WITH for consistent scoping
    query += `
      WITH r, u, d, i
    `;
  }

  query += `
    RETURN r, u.id AS creatorId, d.name AS typeName, collect(i.name) AS ingredients
    ORDER BY r.createdAt DESC
  `;

  const result = await session.run(query, { typeFilter });
  return result.records.map(formatRecipe);
};



exports.findByIdAndUser = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
        OPTIONAL MATCH (r)-[:HAS_INGREDIENT]->(i:Ingredient) // NEW: Match ingredients
        RETURN r, d.name AS typeName, collect(i.name) AS ingredients // NEW: Collect ingredient names
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
        OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
        OPTIONAL MATCH (r)-[:HAS_INGREDIENT]->(i:Ingredient) // NEW: Match ingredients
        RETURN r, d.name AS typeName, collect(i.name) AS ingredients // NEW: Collect ingredient names
        `,
        { name, userId }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};





exports.update = async (session, recipeId, recipeData, userId) => {
  const { name, description, ingredients, steps, calories, protein, allergyInfo, private: isPrivate, type } = recipeData;

  if (!["Vegetarian", "Non-Vegetarian"].includes(type)) {
    throw new Error("Invalid recipe type. Must be 'Vegetarian' or 'Non-Vegetarian'.");
  }

  // Step 1: Update the Recipe node properties and its HAS_TYPE relationship
  const updateResult = await session.run(
    `
    MATCH (u:User {id: $userId})-[c:CREATED]->(r:Recipe {id: $recipeId})
    OPTIONAL MATCH (r)-[oldRel:HAS_TYPE]->(:DietaryType)
    DELETE oldRel
    WITH r, u, c // Carry 'r', 'u', 'c' forward after delete
    MERGE (d:DietaryType {name: $type})
    CREATE (r)-[:HAS_TYPE]->(d)
    SET r += {
        name: $name,
        description: $description,
        steps: $steps,
        calories: toInteger($calories),
        protein: toInteger($protein),
        private: $isPrivate,
        allergyInfo: $allergyInfo,
        updatedAt: datetime()
    }, c.isCreatedBy = "deepak"
    RETURN r, d.name AS typeName // Return the updated recipe and its type
    `,
    { userId, recipeId, name, description, steps, calories, protein, allergyInfo, isPrivate, type }
  );

  // Problem 1 Fix: Only proceed with ingredient updates if the recipe was successfully found and updated
  if (updateResult.records.length === 0) {
      return null; // Recipe not found or user not authorized to update
  }

  // Step 2: Delete existing HAS_INGREDIENT relationships
  await session.run(
    `
    MATCH (r:Recipe {id: $recipeId})-[rel:HAS_INGREDIENT]->()
    DELETE rel
    `,
    { recipeId }
  );

  // Step 3: Create new HAS_INGREDIENT relationships
  if (ingredients && ingredients.length > 0) {
    for (const ing of ingredients) {
      await session.run(
        `
        MERGE (i:Ingredient {name: $ing})
        WITH i // Ensure 'i' is in scope for the next MATCH
        MATCH (r:Recipe {id: $recipeId})
        MERGE (r)-[:HAS_INGREDIENT]->(i)
        `,
        { recipeId, ing }
      );
    }
  }

  // Fetch the fully updated recipe with its new ingredients to return
  // This ensures the client gets the most up-to-date representation.
  const finalRecipeResult = await session.run(
    `
    MATCH (r:Recipe {id: $recipeId})
    OPTIONAL MATCH (r)-[:HAS_TYPE]->(d:DietaryType)
    OPTIONAL MATCH (r)-[:HAS_INGREDIENT]->(i:Ingredient)
    RETURN r, d.name AS typeName, collect(i.name) AS ingredients
    `,
    { recipeId }
  );

  return formatRecipe(finalRecipeResult.records[0]);
};



exports.deleteById = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        DETACH DELETE r // DETACH DELETE removes the node and all its relationships (including HAS_TYPE and HAS_INGREDIENT)
        RETURN count(r) as deletedCount
        `,
        { userId, recipeId }
    );
    return result.records[0].get('deletedCount');
};

// added 2025-07-14
exports.seedTopIngredients = async (session) => {
  const ingredients = [
    'Salt',
    'Sugar',
    'Onion',
    'Garlic',
    'Tomato',
    'Butter',
    'Milk',
    'Egg',
    'Chicken',
    'Cumin'
  ];

  for (const ing of ingredients) {
    await session.run(`
      MERGE (i:Ingredient {name: $ing}) // Use MERGE to create if not exists
    `, { ing });
  }

  return ingredients.length;
};