const Todo = require('../models/Todo');

const getTodos = async (req, res, next) => {
  try {
    const todos = await Todo.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: todos });
  } catch (error) {
    next(error);
  }
};

const createTodo = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, category } = req.body;
    const count = await Todo.countDocuments();
    const todo = await Todo.create({
      title,
      description,
      priority,
      dueDate,
      category,
      order: count,
    });
    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!todo) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// جديد: تحديث ترتيب المهام دفعة واحدة (Drag & Drop)
const reorderTodos = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ id, order }, ...]
    const bulkOps = items.map((item) => ({
      updateOne: { filter: { _id: item.id }, update: { order: item.order } },
    }));
    await Todo.bulkWrite(bulkOps);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos };