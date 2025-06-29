const express = require('express');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
    createRecipe,
    getAllUserRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    browseAllRecipes 
} = require('../controllers/recipeController');
const router = express.Router();

const recipeValidation = [
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('ingredients', 'Ingredients are required').not().isEmpty(),
    check('steps', 'Steps are required').not().isEmpty(),
    check('calories', 'Calories must be a number').isNumeric(),
    check('protein', 'Protein must be a number').isNumeric()
];


router.post('/', [authMiddleware, recipeValidation], createRecipe);

router.get('/', authMiddleware, getAllUserRecipes);

router.get('/all', authMiddleware, browseAllRecipes); 

router.get('/:id', authMiddleware, getRecipeById);

router.put('/:id', [authMiddleware, recipeValidation], updateRecipe);

router.delete('/:id', authMiddleware, deleteRecipe);

module.exports = router;
