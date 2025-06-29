const { v4: uuidv4 } = require('uuid');

// Helper to format recipe properties from Neo4j record
const formatRecipe = (record) => {
    if (!record) return null;
    const recipe = record.get('r').properties;

    recipe.calories = Number(recipe.calories);
    recipe.protein = Number(recipe.protein);
    
    if (record.has('creatorId')) {
        recipe.creatorId = record.get('creatorId');
    }
    return recipe;
};


exports.create = async (session, recipeData, userId) => {
    const recipeId = uuidv4();
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        CREATE (r:Recipe {
            id: $recipeId,
            name: $name,
            description: $description,
            ingredients: $ingredients,
            steps: $steps,
            calories: toInteger($calories),
            protein: toInteger($protein),
            allergyInfo: $allergyInfo,
            createdAt: timestamp(),
            updatedAt: timestamp()
        })
        CREATE (u)-[:CREATED]->(r)
        RETURN r
        `,
        { userId, recipeId, ...recipeData }
    );
    return formatRecipe(result.records[0]);
};


exports.findAllByUserId = async (session, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe)
        RETURN r
        ORDER BY r.createdAt DESC
        `,
        { userId }
    );
    return result.records.map(formatRecipe);
};

exports.findByIdAndUser = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        RETURN r
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
        RETURN r
        `,
        { name, userId }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};


exports.findAll = async (session) => {
    const result = await session.run(
        `
        MATCH (u:User)-[:CREATED]->(r:Recipe)
        RETURN r, u.id AS creatorId
        ORDER BY r.createdAt DESC
        `
    );
    
    return result.records.map(formatRecipe);
};



exports.update = async (session, recipeId, recipeData, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        SET r += {
            name: $name,
            description: $description,
            ingredients: $ingredients,
            steps: $steps,
            calories: toInteger($calories),
            protein: toInteger($protein),
            allergyInfo: $allergyInfo,
            updatedAt: timestamp()
        }
        RETURN r
        `,
        { userId, recipeId, ...recipeData }
    );
    if (result.records.length === 0) return null;
    return formatRecipe(result.records[0]);
};


exports.deleteById = async (session, recipeId, userId) => {
    const result = await session.run(
        `
        MATCH (u:User {id: $userId})-[:CREATED]->(r:Recipe {id: $recipeId})
        DETACH DELETE r
        RETURN count(r) as deletedCount
        `,
        { userId, recipeId }
    );
    return result.records[0].get('deletedCount');
};
