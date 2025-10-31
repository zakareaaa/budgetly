import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
  setLoading(true);
  setMessage("");

  try {
    const response = await fetch("http://localhost:5002/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (err) {
      console.log("Failed to parse JSON:", err);
    }

    // If response is OK (2xx)
    if (response.ok) {
      setMessage(data.message || "Registered successfully!");
      navigate("/login");
    } else {
      // For errors like 409 (email exists) or 500
      setMessage(data.message || "An error occurred");
    }

  } catch (err) {
    console.error(err);
    setMessage("Server error, please try again");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="sign-up-container">
      <h2>Register</h2>
      <form
        className="sign-up-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <label htmlFor="name"><strong>Name</strong></label>
          <input
            type="text"
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email"><strong>Email</strong></label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password"><strong>Password</strong></label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>

      {message && <p style={{ color: "#00bcd4", marginTop: "1rem" }}>{message}</p>}

      <div className="already-account">
        <p>Already have an account?</p>
        <Link to="/login" className="form-link-btn">Log In</Link>
      </div>
    </div>
  );
};

export default SignUp;
