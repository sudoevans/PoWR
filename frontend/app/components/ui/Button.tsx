import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseStyles = "rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:ring-offset-2 focus:ring-offset-[#0A0B0D]";
  
  const variants = {
    primary: "bg-[#0052FF] text-white hover:bg-[#0040CC] active:bg-[#003399]",
    secondary: "bg-[#141519] text-white hover:bg-[#1A1B1F] active:bg-[#0F1012]",
    outline: "border-2 border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF] hover:text-white active:bg-[#0040CC]",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

