import { useState } from "react";
import { useLocation } from "wouter";
import { logoutUser } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  userName: string;
}

export default function Header({ userName }: HeaderProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, clearUser } = useAuth();
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <i className="fas fa-parking text-primary text-2xl"></i>
              <h1 className="ml-2 text-xl font-bold text-gray-800">ParkSpot</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <a href="#" className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-primary">Map</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Favorites</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">History</a>
          </div>

          {/* Profile Dropdown */}
          <div className="ml-3 relative flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="sr-only">Open user menu</span>
                <Avatar>
                  <AvatarImage src={user?.photoURL || ""} alt={userName} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">{userName}</span>
                <i className="fas fa-chevron-down ml-1 text-gray-400 text-xs hidden md:block"></i>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <span className="flex items-center">
                    <i className="fas fa-user-circle mr-2"></i>
                    Your Profile
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="flex items-center">
                    <i className="fas fa-cog mr-2"></i>
                    Settings
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <span className="flex items-center">
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Sign out
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
