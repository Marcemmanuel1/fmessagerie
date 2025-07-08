import { useState, useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error("No token found");
        }

        const response = await fetch("http://localhost:5000/api/check-auth", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
        
        // Optionnel : Rafraîchir les données utilisateur si nécessaire
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Nettoyage en cas d'échec
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <BeatLoader color="#6366f1" size={15} />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;