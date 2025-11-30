import { useState, useEffect } from "react";
import { enhancedSearchLocation } from "../utils/SearchAddress";

export default function useAddressSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Clear results function
  const clearResults = () => {
    setResults([]);
  };

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await enhancedSearchLocation(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return {  query, setQuery, results, loading, clearResults };
}