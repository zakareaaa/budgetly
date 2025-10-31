import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const ProfileForm = () => {

  function toProperCase(str) {
    // Add spaces before capital letters
    const withSpaces = str.replace(/([A-Z])/g, " $1");
    // Capitalize first letter of each word
    return withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
  }


  const navigate = useNavigate();

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  const [stats, setStats] = useState({
    currentBalance: "",
    monthlyIncome: "",
    savingsGoal: "",
  });

  useEffect(() => {
    if (user && user.stats) {
      setStats({
        currentBalance: user.stats.currentBalance || "",
        monthlyIncome: user.stats.monthlyIncome || "",
        savingsGoal: user.stats.savingsGoal || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setStats({ ...stats, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch("http://localhost:5002/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, stats }),
    });

    const data = await response.json();

    if (response.ok) {
      // Backend returns updated user in data.data
      const updatedUser = data.data;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Navigate to dashboard
      navigate("/dashboard");
    } else {
      alert(data.message || "Failed to update profile");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Try again.");
  }
};




  return (
    <div className="initial-data-form">
      <h2>Welcome, {user?.name}! Complete Your Profile</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(stats).map((key) => (
          <div key={key}>
            <label>{toProperCase(key)}</label>
            <input
              type="number"
              name={key}
              value={stats[key]}
              onChange={handleChange}
              placeholder="Enter amount"
              required
            />
          </div>
        ))}
        <button type="submit">Save and Continue</button>
      </form>
    </div>
  );
};

export default ProfileForm;
