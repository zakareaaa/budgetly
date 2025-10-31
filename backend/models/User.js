import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const budgetSchema = new mongoose.Schema({
  category: { type: String, required: true },
  spent: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ["good", "warning", "danger"], default: "good" }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stats: {
    currentBalance: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    monthlySpending: { type: Number, default: 0 },  // ← ADD THIS LINE
    savingsGoal: { type: Number, default: 0 }
  },
  transactions: [transactionSchema],
  budgets: [budgetSchema],
  profileComplete: { type: Boolean, default: false }
});

export default mongoose.model("User", userSchema);