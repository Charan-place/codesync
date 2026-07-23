import { motion } from 'framer-motion';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 22, md: 26, lg: 34 }[size];
  const text = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size];
  return (
    <motion.div
      className="flex items-center gap-2 select-none"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <svg width={dims} height={dims} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="codesync-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b87ff" />
            <stop offset="1" stopColor="#2b52e0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#codesync-logo-grad)" />
        <path
          d="M12.5 11L9 16l3.5 5M19.5 11L23 16l-3.5 5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-semibold tracking-tight ${text}`}>CodeSync</span>
    </motion.div>
  );
}
