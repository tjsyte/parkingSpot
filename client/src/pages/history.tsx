import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import ParkingSpotList from "@/components/ParkingSpotList";

export default function History() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['/api/history', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      try {
        const userResponse = await fetch(`/api/users/uid/${user.uid}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        const historyResponse = await fetch(`/api/history/${userData.id}`);
        if (!historyResponse.ok) {
          throw new Error('Failed to fetch history');
        }
        return historyResponse.json();
      } catch (error) {
        console.error("Error fetching history:", error);
        return [];
      }
    },
    enabled: isAuthenticated && Boolean(user?.uid)
  });

  return (
    <div>
      <Header title="Parking History" />
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error loading history</p>
      ) : (
        <ParkingSpotList spots={history} />
      )}
    </div>
  );
}