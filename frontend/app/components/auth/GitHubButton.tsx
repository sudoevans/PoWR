"use client";

import React from "react";
import { Button } from "../ui";
import { Github } from "lucide-react";

interface GitHubButtonProps {
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export const GitHubButton: React.FC<GitHubButtonProps> = ({
  onClick,
  size = "md",
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = "http://localhost:3001/api/auth/github";
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="flex items-center justify-center gap-2"
      size={size}
    >
      <Github className="w-5 h-5" />
      Continue with GitHub
    </Button>
  );
};

