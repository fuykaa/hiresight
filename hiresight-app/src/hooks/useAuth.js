import api from "../lib/api";
import { useApi } from "./useApi";

export const useAuth = () => {
  const { callApi, loading, error } = useApi();

  const register = async (userData) => {
    return await callApi(api.post("/register", userData));
  };

  const login = async (credentials) => {
    return await callApi(api.post("/login", credentials));
  };

  const logout = async () => {
    return await callApi(api.post("/api/logout"));
  };

  return {
    register,
    login,
    logout,
    loading,
    error,
  };
};
