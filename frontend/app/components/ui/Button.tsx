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
  const baseStyles = "cursor-pointer rounded-full font-medium transition-all duration-120 ease-out focus:outline-none focus:ring-2 focus:ring-[#3b76ef] focus:ring-offset-2 focus:ring-offset-[#0A0B0D]";
  
  const variants = {
    primary: "bg-[#3b76ef] text-white hover:bg-[#2d5fd4] hover:shadow-[0_0_20px_rgba(59,118,239,0.4)] active:bg-[#1f48b9] disabled:opacity-60 disabled:cursor-not-allowed",
    secondary: "bg-[#141519] text-white hover:bg-[#1A1B1F] active:bg-[#0F1012] disabled:opacity-60 disabled:cursor-not-allowed",
    outline: "border-2 border-[#3b76ef] text-[#3b76ef] hover:bg-[#3b76ef] hover:text-white hover:shadow-[0_0_20px_rgba(59,118,239,0.3)] active:bg-[#2d5fd4] disabled:opacity-60 disabled:cursor-not-allowed",
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

