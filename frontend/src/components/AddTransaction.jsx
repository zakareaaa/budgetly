// AddTransaction.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  // Check if we're editing
  const { transaction, isEdit } = location.state || {};

  const [formData, setFormData] = useState({
    type: 'income',
    description: '',
    amount: '',
  });

  useEffect(() => {
    if (isEdit && transaction) {
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
      });
    }
  }, [isEdit, transaction]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) return;

  const endpoint = isEdit ? 'edit-transaction' : 'add-transaction';

  try {
    const bodyData = isEdit
      ? { email: user.email, id: transaction._id, ...formData }
      : { email: user.email, ...formData };

    const response = await fetch(`http://localhost:5002/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    const data = await response.json();

    if (response.ok) {
      // Update user object with new transactions and stats
      const updatedUser = {
        ...user,
        transactions: data.transactions || data.updatedUser?.transactions || user.transactions,
        stats: data.stats || data.updatedUser?.stats || user.stats
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/dashboard');
    } else {
      console.error(data.message || 'Failed to save transaction');
    }
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="add-transaction-form">
      <h2>{isEdit ? 'Edit Transaction' : 'Add New Transaction'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div>
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            required
          />
        </div>

        <div>
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
          />
        </div>

        <button type="submit">{isEdit ? 'Update Transaction' : 'Add Transaction'}</button>
      </form>
    </div>
  );
};

export default AddTransaction;
