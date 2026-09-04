const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos } = require('../controllers/todoController');

router.use(protect); // كل ما تحت هذا السطر محمي

router.route('/').get(getTodos).post(createTodo);
router.patch('/reorder', reorderTodos);
router.route('/:id').put(updateTodo).delete(deleteTodo);

module.exports = router;