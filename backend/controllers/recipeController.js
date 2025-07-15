const { validationResult } = require('express-validator');
const { getSession } = require('../config/db'); // Assuming getSession manages session opening/closing
const recipeModel = require('../models/recipeModel');


exports.createRecipe = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const session = getSession();
    try {
        const recipeData = { ...req.body };
        const userId = req.user.id;
        
        // Note: The recipeModel.create function now includes server-side validation for 'type'.
        // If findRecipeByNameAndUser also needs to consider 'type' for uniqueness, it would need modification too.
        const existingRecipe = await recipeModel.findRecipeByNameAndUser(session, recipeData.name, userId);
        if (existingRecipe) {
            return res.status(400).json({ msg: 'You already have a recipe with this name' });
        }

        const newRecipe = await recipeModel.create(session, recipeData, userId);
        res.status(201).json(newRecipe);
    } catch (error) {
        console.error('Create Recipe Error:', error.message);
        // NEW: Handle specific validation error from model
        if (error.message.includes('Invalid recipe type')) {
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).send('Server Error');
    } finally {
        // Assuming getSession() handles session closing, if not, ensure session.close() is here.
        // If getSession() returns a new session for each call, then session.close() is needed.
        // If it's a shared session, then closing it here might be problematic.
        // Based on your previous routes, you might have a middleware for session management.
        // If you have a middleware that opens/closes session per request, remove this finally block.
        // For now, keeping it as per your original structure.
        await session.close(); 
    }
};

exports.getAllUserRecipes = async (req, res) => {
    const session = getSession();
    try {
        const userId = req.user.id;
        // NEW: Extract 'type' query parameter from the request
        const typeFilter = req.query.type; 
        // CHANGED: Pass the typeFilter to recipeModel.findAllByUserId
        const recipes = await recipeModel.findAllByUserId(session, userId, typeFilter);
        res.json(recipes);
    } catch (error) {
        console.error('Get All Recipes Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};

exports.getRecipeById = async (req, res) => {
    const session = getSession();
    try {
        const recipeId = req.params.id;
        const userId = req.user.id;
        // Note: recipeModel.findByIdAndUser is already updated to return 'type' in formatRecipe
        const recipe = await recipeModel.findByIdAndUser(session, recipeId, userId);
        if (!recipe) {
            return res.status(404).json({ msg: 'Recipe not found or you do not have permission to view it' });
        }
        res.json(recipe);
    } catch (error) {
        console.error('Get Recipe By ID Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};

exports.updateRecipe = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const session = getSession();
    try {
        const recipeId = req.params.id;
        const userId = req.user.id;
        const recipeData = { ...req.body };

        // Note: The recipeModel.update function now includes server-side validation for 'type'.
        const updatedRecipe = await recipeModel.update(session, recipeId, recipeData, userId);
        
        if (!updatedRecipe) {
            return res.status(404).json({ msg: 'Recipe not found or you do not have permission to update it' });
        }
        res.json(updatedRecipe);
    } catch (error) {
        console.error('Update Recipe Error:', error.message);
        // NEW: Handle specific validation error from model
        if (error.message.includes('Invalid recipe type')) {
            return res.status(400).json({ msg: error.message });
        }
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};


exports.deleteRecipe = async (req, res) => {
    const session = getSession();
    try {
        const recipeId = req.params.id;
        const userId = req.user.id;
        
        const result = await recipeModel.deleteById(session, recipeId, userId);
        
        // Note: recipeModel.deleteById now returns 'deletedCount' (a number), not an object with 'nodesDeleted'
        if (result === 0) { // CHANGED: Check if result (deletedCount) is 0
            return res.status(404).json({ msg: 'Recipe not found or you do not have permission to delete it' });
        }
        
        res.json({ msg: 'Recipe removed' });
    } catch (error) {
        console.error('Delete Recipe Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};

exports.browseAllRecipes = async (req, res) => {
    const session = getSession();
    try {
        // NEW: Extract 'type' query parameter from the request
        const typeFilter = req.query.type;
        // CHANGED: Pass the typeFilter to recipeModel.findAll
        const recipes = await recipeModel.findAll(session, typeFilter);
        res.json(recipes);
    } catch (error) {
        console.error('Browse All Recipes Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};