"use client";
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

// Floating metric badge component
const FloatingBadge = ({ label, value, color, delay, position, isDark }) => (
  <div
    className={`absolute hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-2xl backdrop-blur-xl border shadow-xl animate-float-badge ${
      isDark
        ? 'bg-slate-900/60 border-white/10 shadow-black/20'
        : 'bg-white/70 border-slate-200/60 shadow-slate-200/30'
    }`}
    style={{
      ...position,
      animationDelay: `${delay}s`,
      zIndex: 2,
    }}
    data-testid={`floating-badge-${label.toLowerCase()}`}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
      style={{ background: color }}
    >
      {value}
    </div>
    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
      {label}
    </span>
  </div>
);

// Orbiting dot
const OrbitDot = ({ size, duration, distance, color, delay }) => (
  <div
    className="absolute left-1/2 top-1/2 animate-orbit pointer-events-none"
    style={{
      width: `${distance * 2}px`,
      height: `${distance * 2}px`,
      marginLeft: `-${distance}px`,
      marginTop: `-${distance}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    }}
  >
    <div
      className="absolute rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: color,
        top: 0,
        left: '50%',
        marginLeft: `-${size / 2}px`,
        boxShadow: `0 0 ${size * 3}px ${color}`,
      }}
    />
  </div>
);

// Pulse ring component
const PulseRing = ({ delay, size, isDark }) => (
  <div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse-ring pointer-events-none"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      animationDelay: `${delay}s`,
      border: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)'}`,
    }}
  />
);

// Typing text effect
export const TypedText = ({ words, className }) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const word = words[currentWord];
    const typeSpeed = isDeleting ? 40 : 80;
    const pauseTime = isDeleting ? 200 : 2000;

    if (!isDeleting && displayed === word) {
      timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setCurrentWord((prev) => (prev + 1) % words.length);
    } else {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(
          isDeleting ? word.substring(0, displayed.length - 1) : word.substring(0, displayed.length + 1)
        );
      }, typeSpeed);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [displayed, isDeleting, currentWord, words]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-blink ml-0.5 inline-block w-[3px] h-[0.85em] bg-current align-middle opacity-80" />
    </span>
  );
};

// Main hero animations wrapper
const HeroAnimations = () => {
  const { isDark } = useTheme();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const parallax = (factor) => ({
    transform: `translate(${mousePos.x * factor}px, ${mousePos.y * factor}px)`,
    transition: 'transform 0.3s ease-out',
  });

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Floating metric badges with parallax */}
      <div style={parallax(15)}>
        <FloatingBadge
          label="DR"
          value="72"
          color="linear-gradient(135deg, #10b981, #059669)"
          delay={0}
          position={{ top: '18%', left: '8%' }}
          isDark={isDark}
        />
      </div>
      <div style={parallax(-20)}>
        <FloatingBadge
          label="DA"
          value="65"
          color="linear-gradient(135deg, #3b82f6, #2563eb)"
          delay={1.5}
          position={{ top: '25%', right: '6%' }}
          isDark={isDark}
        />
      </div>
      <div style={parallax(10)}>
        <FloatingBadge
          label="PA"
          value="58"
          color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          delay={3}
          position={{ bottom: '28%', left: '5%' }}
          isDark={isDark}
        />
      </div>
      <div style={parallax(-12)}>
        <FloatingBadge
          label="TF"
          value="41"
          color="linear-gradient(135deg, #f59e0b, #d97706)"
          delay={2}
          position={{ bottom: '22%', right: '8%' }}
          isDark={isDark}
        />
      </div>

      {/* Orbiting dots */}
      <div style={parallax(5)}>
        <OrbitDot size={6} duration={20} distance={220} color="rgba(139,92,246,0.6)" delay={0} />
        <OrbitDot size={4} duration={28} distance={300} color="rgba(6,182,212,0.5)" delay={2} />
        <OrbitDot size={5} duration={35} distance={180} color="rgba(139,92,246,0.4)" delay={5} />
      </div>

      {/* Pulse rings */}
      <PulseRing delay={0} size={300} isDark={isDark} />
      <PulseRing delay={1.5} size={500} isDark={isDark} />
      <PulseRing delay={3} size={700} isDark={isDark} />

      {/* Glowing accent orbs */}
      <div
        className="absolute w-3 h-3 rounded-full animate-sparkle"
        style={{
          top: '30%',
          left: '20%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, transparent 70%)',
          boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          animationDelay: '0s',
          ...parallax(25),
        }}
      />
      <div
        className="absolute w-2 h-2 rounded-full animate-sparkle"
        style={{
          top: '60%',
          right: '25%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, transparent 70%)',
          boxShadow: '0 0 15px rgba(6,182,212,0.4)',
          animationDelay: '1s',
          ...parallax(-18),
        }}
      />
      <div
        className="absolute w-2.5 h-2.5 rounded-full animate-sparkle"
        style={{
          top: '45%',
          left: '70%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)',
          boxShadow: '0 0 18px rgba(139,92,246,0.3)',
          animationDelay: '2s',
          ...parallax(20),
        }}
      />
    </div>
  );
};

export default HeroAnimations;
