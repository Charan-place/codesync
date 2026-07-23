import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// Wraps a page/section with a soft, Apple-esque entrance animation.
export default function PageFade({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
