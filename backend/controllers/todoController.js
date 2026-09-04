const Todo = require('../models/Todo');

const getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find({ user: req.user._id }).sort({ order: 1 });
    res.status(200).json({ success: true, data: todos });
  } catch (error) { next(error); }
};

const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;
    const count = await Todo.countDocuments({ user: req.user._id });
    const todo = await Todo.create({ user: req.user._id, title, description, priority, dueDate, category, order: count });
    res.status(201).json({ success: true, data: todo });
  } catch (error) { next(error); }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true, runValidators: true });
    if (!todo) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.status(200).json({ success: true, data: todo });
  } catch (error) { next(error); }
};

const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) { next(error); }
};

const reorderTodos = async (req, res, next) => {
  try {
    const { items } = req.body;
    const bulkOps = items.map((item) => ({
      updateOne: { filter: { _id: item.id, user: req.user._id }, update: { order: item.order } },
    }));
    await Todo.bulkWrite(bulkOps);
    res.status(200).json({ success: true });
  } catch (error) { next(error); }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos };