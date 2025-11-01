import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/budgetly')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

function calculateStats(transactions, existingStats = {}) {
  let transactionBalance = 0;
  let transactionIncome = 0;
  let transactionSpending = 0;

  transactions.forEach(t => {
    if (t.type === 'income') {
      transactionBalance += t.amount;
      transactionIncome += t.amount;
    } else {
      transactionBalance -= t.amount;
      transactionSpending += t.amount;
    }
  });

  // Preserve manually set values, only update transaction-based calculations
  return {
    currentBalance: (existingStats.currentBalance || 0) + transactionBalance,
    monthlyIncome: existingStats.monthlyIncome || 0, // Keep the manually set income
    monthlySpending: transactionSpending, // Update spending based on transactions
    savingsGoal: existingStats.savingsGoal || 0 // Keep the manually set goal
  };
}

// --- Test route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// --- Signup ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", data: { name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User doesn't exist" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        stats: user.stats,
        transactions: user.transactions,
        budgets: user.budgets
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Update/Save user profile (stats)
// Update/Save user profile (stats)
app.post('/api/profile', async (req, res) => {
  const { email, stats } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only update stats if provided
    if (stats) {
      user.stats = {
        currentBalance: Number(stats.currentBalance) || 0,
        monthlyIncome: Number(stats.monthlyIncome) || 0,
        monthlySpending: Number(stats.monthlySpending) || 0,
        savingsGoal: Number(stats.savingsGoal) || 0
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        stats: user.stats,
        transactions: user.transactions,
        budgets: user.budgets
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Add transaction
// Add transaction
app.post('/api/add-transaction', async (req, res) => {
  const { email, type, description, amount } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newTransaction = { type, description, amount: Number(amount), date: new Date() };
    user.transactions.push(newTransaction);

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = {
        currentBalance: 0,
        monthlyIncome: 0,
        monthlySpending: 0,
        savingsGoal: 0
      };
    }

    // Only update currentBalance and monthlySpending
    if (type === 'income') {
      user.stats.currentBalance += Number(amount);
    } else {
      user.stats.currentBalance -= Number(amount);
      user.stats.monthlySpending = (user.stats.monthlySpending || 0) + Number(amount);
    }

    await user.save();
    
    // Return the complete user data
    res.json({ 
      message: 'Transaction added', 
      transactions: user.transactions,
      stats: user.stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit transaction
app.post('/api/edit-transaction', async (req, res) => {
  const { email, id, type, description, amount } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transaction = user.transactions.id(id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Reverse the old transaction's effect
    if (transaction.type === 'income') {
      user.stats.currentBalance -= transaction.amount;
    } else {
      user.stats.currentBalance += transaction.amount;
      user.stats.monthlySpending -= transaction.amount;
    }

    // Apply the new transaction
    transaction.type = type;
    transaction.description = description;
    transaction.amount = Number(amount);

    if (type === 'income') {
      user.stats.currentBalance += Number(amount);
    } else {
      user.stats.currentBalance -= Number(amount);
      user.stats.monthlySpending = (user.stats.monthlySpending || 0) + Number(amount);
    }

    await user.save();
    res.json({ message: 'Transaction updated', updatedUser: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete transaction - updated version
app.post('/api/delete-transaction', async (req, res) => {
  const { email, _id } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactionIndex = user.transactions.findIndex(
      t => t._id.toString() === _id
    );
    
    if (transactionIndex === -1) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = user.transactions[transactionIndex];

    // Reverse the transaction's effect on stats
    if (transaction.type === 'income') {
      user.stats.currentBalance -= transaction.amount;
    } else {
      user.stats.currentBalance += transaction.amount;
      user.stats.monthlySpending -= transaction.amount;
    }

    // Remove the transaction
    user.transactions.splice(transactionIndex, 1);

    await user.save();

    res.json({
      message: 'Transaction deleted',
      transactions: user.transactions,
      stats: user.stats
    });
  } catch (err) {
    console.error('🔥 Delete transaction error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- Set or update a budget for a category ---
app.post('/api/set-budget', async (req, res) => {
  const { email, category, budget } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize budgets if not exist
    if (!user.budgets) user.budgets = [];

    // Find if category already exists
    const existingBudget = user.budgets.find(b => b.category === category);

    if (existingBudget) {
      // Update existing
      existingBudget.budget = budget;
    } else {
      // Add new
      user.budgets.push({
        category,
        budget,
        spent: 0,
        percentage: 0,
        status: 'good'
      });
    }

    await user.save();
    res.json({ message: 'Budget saved successfully', budgets: user.budgets });

  } catch (err) {
    console.error('🔥 Error setting budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- Delete a budget ---
app.post('/api/delete-budget', async (req, res) => {
  const { email, category } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove the matching category
    user.budgets = user.budgets.filter(b => b.category !== category);

    await user.save();
    res.json({ message: 'Budget deleted successfully', budgets: user.budgets });

  } catch (err) {
    console.error('🔥 Error deleting budget:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
