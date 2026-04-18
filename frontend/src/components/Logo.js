"use client";
import Image from 'next/image';
const Logo = ({ className = "h-8", showText = false }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Image 
        src="/logo-agedify.png" 
        alt="Agedify" 
        width={160}
        height={40}
        priority
        className="h-full w-auto object-contain"
        style={{ maxHeight: '40px' }}
      />
      {showText && (
        <span className="text-xl font-bold text-foreground">Agedify</span>
      )}
    </div>
  );
};

export default Logo;
