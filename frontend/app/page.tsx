"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./components/ui";
import { LoginModal } from "./components/auth/LoginModal";
import LiquidEther from "./components/ui/LiquidEther";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] relative overflow-hidden">
      {/* LiquidEther Background */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#3b76ef', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-[#0A0B0D]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6 px-4"
          >
            <span className="block">Proof of Work</span>
            <span className="block bg-gradient-to-r from-[#3b76ef] via-[#FF9FFC] to-[#B19EEF] bg-clip-text text-transparent">
              Reputation
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Verifiable, artifact-backed evidence of real work.
            <br className="hidden sm:block" />
            <span className="block sm:inline"> </span>
            <span className="text-gray-500">Participation can be faked. Proof of work cannot.</span>
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                onClick={() => setIsModalOpen(true)}
                size="lg"
                className="px-8 py-4 text-lg font-semibold shadow-lg shadow-[#3b76ef]/20 hover:shadow-[#3b76ef]/50 hover:shadow-2xl transition-all duration-300"
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            variants={itemVariants}
            className="mt-16 text-sm text-gray-500 space-y-2"
          >
            <p>Connect your GitHub • Analyze your contributions • Build your reputation</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
