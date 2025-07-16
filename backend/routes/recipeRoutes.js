const express = require('express');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  createRecipe,
  getAllUserRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  browseAllRecipes,
  seedIngredients,
  getAllIngredients,
  toggleLike,
  getFavouriteRecipes
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

// POST recipe
router.post('/', [authMiddleware, recipeValidation], createRecipe);

// GET all user recipes
router.get('/', authMiddleware, getAllUserRecipes);

// GET all public recipes
router.get('/all', authMiddleware, browseAllRecipes);

// seed ingredients
router.post('/seed-ingredients', seedIngredients);

router.get('/favourites', authMiddleware, getFavouriteRecipes);

// get all ingredients (before /:id)
router.get('/ingredients', getAllIngredients);

// GET recipe by ID (always LAST of GET routes)
router.get('/:id', authMiddleware, getRecipeById);

// PUT update recipe
router.put('/:id', [authMiddleware, recipeValidation], updateRecipe);

router.post('/toggle-like', authMiddleware, toggleLike);

// DELETE recipe
router.delete('/:id', authMiddleware, deleteRecipe);


module.exports = router;