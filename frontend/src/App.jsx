import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';

import './App.css';
import AddTransaction from './components/AddTransaction';
import SetBudget from './components/SetBudget';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<SignUp />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/login' element={<Login />} />
        <Route path='/init' element={<ProfileForm />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/add-transaction' element={<AddTransaction />} />
        <Route path='/set-budget' element={<SetBudget />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
