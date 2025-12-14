import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div className={`rounded-lg bg-[#141519] p-6 ${className}`}>
      {children}
    </div>
  );
};

