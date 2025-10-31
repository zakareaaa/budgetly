import { useState } from "react";
import { Link , useNavigate} from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:5002/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.data
        localStorage.setItem("user",JSON.stringify(userData))  
        const stats = userData.stats
        if(!stats || !stats.currentBalance || !stats.monthlyIncome || !stats.savingsGoal){
          navigate('/init');
        }else{
          navigate('/dashboard');
        }
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Log In</h2>
      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
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
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {message && <p style={{ color: "#00bcd4", marginTop: "1rem" }}>{message}</p>}

      <div className="no-account">
        <p>Don’t have an account?</p>
        <Link to="/signup" className="form-link-btn">Sign Up</Link>
      </div>
    </div>
  );
};

export default Login;
