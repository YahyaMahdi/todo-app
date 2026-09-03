const express = require('express');
const router = express.Router();
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  reorderTodos,
} = require('../controllers/todoController');

router.route('/').get(getTodos).post(createTodo);
router.patch('/reorder', reorderTodos); // لازم قبل '/:id'
router.route('/:id').put(updateTodo).delete(deleteTodo);

module.exports = router;