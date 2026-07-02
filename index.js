require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const errorMiddleware = require('./src/middlewares/error.middleware');

const UserModel = require('./src/models/user.model');
const AccountModel = require('./src/models/account.model');
const IncomeSourceModel = require('./src/models/income-source.model');
const ExpenseCategoryModel = require('./src/models/expense-category.model');
const TransactionModel = require('./src/models/transaction.model');

const authRoutes = require('./src/routes/auth.routes');
const accountRoutes = require('./src/routes/account.routes');
const incomeSourceRoutes = require('./src/routes/income-source.routes');
const expenseCategoryRoutes = require('./src/routes/expense-category.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const summaryRoutes = require('./src/routes/summary.routes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Lazy DB init — runs once per serverless cold start, reuses on warm starts
let dbReady = false;
app.use(async (req, res, next) => {
  if (dbReady) return next();
  try {
    await connectDB();
    await Promise.all([
      UserModel.createIndexes(),
      AccountModel.createIndexes(),
      IncomeSourceModel.createIndexes(),
      ExpenseCategoryModel.createIndexes(),
      TransactionModel.createIndexes(),
    ]);
    dbReady = true;
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Money Management API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/income-sources', incomeSourceRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/summary', summaryRoutes);

app.use(errorMiddleware);

// Local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
