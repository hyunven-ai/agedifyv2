"use client";
import { Suspense } from 'react';
import ComparePage from './ComparePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" /></div>}>
      <ComparePage />
    </Suspense>
  );
}
