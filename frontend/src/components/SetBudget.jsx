import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SetBudget = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    budget: ''
  });
  const [editing, setEditing] = useState(null); // ← track which category is being edited
  const [editValue, setEditValue] = useState(''); // ← store the new value when editing

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Personal Care',
    'Groceries',
    'Other'
  ];

  useEffect(() => {
    if (user && user.budgets) {
      setBudgets(user.budgets);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5002/api/set-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          ...formData 
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, budgets: data.budgets };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setBudgets(data.budgets);
        setFormData({ category: '', budget: '' });
        alert('Budget set successfully!');
      } else {
        console.error(data.message);
        alert('Failed to set budget');
      }
    } catch (err) {
      console.error(err);
      alert('Error setting budget');
    }
  };

  const handleDelete = async (category) => {
    try {
      const response = await fetch('http://localhost:5002/api/delete-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, category })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, budgets: data.budgets };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setBudgets(data.budgets);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 📝 handle saving edited budget
  const handleEditSave = async (category) => {
    if (!editValue || Number(editValue) < 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    try {
      const response = await fetch('http://localhost:5002/api/set-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          category,
          budget: editValue
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, budgets: data.budgets };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setBudgets(data.budgets);
        setEditing(null);
        alert('Budget updated successfully!');
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="set-budget-wrapper">
      <div className="budget-header">
        <h2>Manage Budgets</h2>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </div>

      {/* Form to add/update budget */}
      <div className="budget-form-section">
        <h3>Set New Budget</h3>
        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Budget Amount ($)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Enter budget amount"
              min="0"
              step="0.01"
              required
            />
          </div>

          <button type="submit" className="submit-btn">Set Budget</button>
        </form>
      </div>

      {/* Existing budgets list */}
      <div className="existing-budgets">
        <h3>Your Budgets</h3>
        {budgets.length === 0 ? (
          <p className="no-budgets">No budgets set yet. Create one above!</p>
        ) : (
          <div className="budgets-list">
            {budgets.map((budget, index) => (
              <div key={index} className="budget-card">
                <div className="budget-card-header">
                  <h4>{budget.category}</h4>
                  <div className="budget-actions">
                    {editing === budget.category ? (
                      <>
                        <button 
                          onClick={() => handleEditSave(budget.category)} 
                          className="save-budget-btn"
                        >
                          💾 Save
                        </button>
                        <button 
                          onClick={() => setEditing(null)} 
                          className="cancel-budget-btn"
                        >
                          ✖ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditing(budget.category);
                            setEditValue(budget.budget);
                          }}
                          className="edit-budget-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(budget.category)}
                          className="delete-budget-btn"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="budget-card-content">
                  {editing === budget.category ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="edit-input"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <>
                      <div className="budget-amounts">
                        <span className="spent">${budget.spent || 0}</span>
                        <span className="separator">/</span>
                        <span className="total">${budget.budget}</span>
                      </div>
                      <div className="budget-progress-bar">
                        <div
                          className={`budget-progress-fill status-${budget.status || 'good'}`}
                          style={{ width: `${Math.min(budget.percentage || 0, 100)}%` }}
                        ></div>
                      </div>
                      <div className="budget-status">
                        <span className={`status-badge ${budget.status || 'good'}`}>
                          {budget.status === 'danger'
                            ? '⚠️ Over Budget'
                            : budget.status === 'warning'
                            ? '⚠️ Near Limit'
                            : '✓ On Track'}
                        </span>
                        <span className="percentage">
                          {Math.round(budget.percentage || 0)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetBudget;
