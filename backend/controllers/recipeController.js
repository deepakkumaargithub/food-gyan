const { validationResult } = require('express-validator');
const { getSession } = require('../config/db');
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
        
        const existingRecipe = await recipeModel.findRecipeByNameAndUser(session, recipeData.name, userId);
        if (existingRecipe) {
            return res.status(400).json({ msg: 'You already have a recipe with this name' });
        }

        const newRecipe = await recipeModel.create(session, recipeData, userId);
        res.status(201).json(newRecipe);
    } catch (error) {
        console.error('Create Recipe Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};

exports.getAllUserRecipes = async (req, res) => {
    const session = getSession();
    try {
        const userId = req.user.id;
        const recipes = await recipeModel.findAllByUserId(session, userId);
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

        const updatedRecipe = await recipeModel.update(session, recipeId, recipeData, userId);
        
        if (!updatedRecipe) {
            return res.status(404).json({ msg: 'Recipe not found or you do not have permission to update it' });
        }
        res.json(updatedRecipe);
    } catch (error) {
        console.error('Update Recipe Error:', error.message);
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
        
        if (result.nodesDeleted === 0) {
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
        const recipes = await recipeModel.findAll(session);
        res.json(recipes);
    } catch (error) {
        console.error('Browse All Recipes Error:', error.message);
        res.status(500).send('Server Error');
    } finally {
        await session.close();
    }
};
