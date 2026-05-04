import { useState } from "react";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiPromise) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPromise;
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Terjadi kesalahan pada server";
      setError(errorMessage);
      throw errorMessage;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error };
};
