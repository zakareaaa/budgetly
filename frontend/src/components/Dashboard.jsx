// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser) {
      navigate('/login');
      return;
    }

    if (!storedUser.stats || !storedUser.stats.currentBalance) {
      navigate('/profile');
      return;
    }

    setUser(storedUser);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount || 0));
  };

  // DELETE TRANSACTION
 const handleDelete = async (_id) => {
  try {
    const response = await fetch('http://localhost:5002/api/delete-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, _id }), // use _id
    });

    const data = await response.json();

    if (response.ok) {
      const updatedUser = { ...user, transactions: data.transactions, stats: data.stats };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      console.error(data.message || 'Failed to delete transaction');
    }
  } catch (err) {
    console.error(err);
  }
};


  // EDIT TRANSACTION
  const handleEdit = (transaction) => {
    navigate('/add-transaction', { state: { transaction, isEdit: true } });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const stats = user.stats || {};
  const transactions = user.transactions || [];
  const budgets = user.budgets || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">

        {/* HEADER */}
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user.name}!</h1>
            <p>Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/init')} className="header-btn">
              ⚙️ Edit Profile
            </button>
            <button onClick={handleLogout} className="header-btn logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Current Balance</h3>
            <div className="stat-value positive">
              {formatCurrency(stats.currentBalance)}
            </div>
            <div className="stat-change">Your available funds</div>
          </div>

          <div className="stat-card">
            <h3>Monthly Income</h3>
            <div className="stat-value neutral">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <div className="stat-change">Expected this month</div>
          </div>

          <div className="stat-card">
            <h3>Monthly Spending</h3>
            <div className="stat-value negative">
              {formatCurrency(stats.monthlySpending || 0)}
            </div>
            <div className="stat-change">
              {stats.monthlyIncome > 0
                ? `${Math.round(((stats.monthlySpending || 0) / stats.monthlyIncome) * 100)}% of income`
                : 'No income set'
              }
            </div>
          </div>

          <div className="stat-card">
            <h3>Savings Goal</h3>
            <div className="stat-value positive">
              {formatCurrency(stats.savingsGoal)}
            </div>
            <div className="stat-change">
              {stats.savingsGoal > 0
                ? `${Math.round((stats.currentBalance / stats.savingsGoal) * 100)}% achieved`
                : 'Set a goal!'
              }
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content">

          {/* TRANSACTIONS */}
          <div className="transactions-section">
            <div className="section-header">
              <h2 className="section-title">Recent Transactions</h2>
              <button
                className="add-btn"
                onClick={() => navigate('/add-transaction')}
              >
                + Add Transaction
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <p>📝 No transactions yet</p>
                <p className="empty-subtext">Add your first transaction to get started!</p>
              </div>
            ) : (
              <div>
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id} className="transaction-item">
                    <div className="transaction-info">
                      <div className={`transaction-icon ${
                        transaction.type === 'expense' ? 'expense-icon' : 'income-icon'
                      }`}>
                        {transaction.icon || (transaction.type === 'expense' ? '💸' : '💰')}
                      </div>
                      <div className="transaction-details">
                        <h4>{transaction.description}</h4>
                        <div className="transaction-date">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <span className={transaction.amount > 0 ? 'positive' : 'negative'}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                      <div className="transaction-actions">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="edit-btn"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="delete-btn"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUDGETS */}
          <div className="budget-section">
            <div className="section-header">
              <h2 className="section-title">Budget Overview</h2>
            </div>

            {budgets.length === 0 ? (
              <div className="empty-state">
                <p>🎯 No budgets set</p>
                <p className="empty-subtext">Set budgets to track your spending!</p>
                <button
                  className="add-btn"
                  style={{ marginTop: '15px' }}
                  onClick={() => navigate('/set-budget')}
                >
                  + Set Budget
                </button>
              </div>
            ) : (
              <div>
                {budgets.map((budget, index) => (
                  <div key={index} className="budget-item">
                    <div className="budget-header">
                      <span className="budget-category">{budget.category}</span>
                      <span className="budget-amounts">
                        ${budget.spent} / ${budget.budget}
                      </span>
                    </div>
                    <div className="budget-progress">
                      <div
                        className={`budget-fill progress-${budget.status || 'good'}`}
                        style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="quick-actions">
        <button
          className="fab"
          onClick={() => navigate('/add-transaction')}
          title="Quick Add Transaction"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
