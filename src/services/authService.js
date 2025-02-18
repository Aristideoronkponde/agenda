// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/auth/';

const register = async (username, password) => {
  return await axios.post(`${API_URL}register`, { username, password });
};

const login = async (username, password) => {
  const response = await axios.post(`${API_URL}login`, { username, password });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
};
