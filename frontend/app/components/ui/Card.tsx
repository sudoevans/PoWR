import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`rounded-[14px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

