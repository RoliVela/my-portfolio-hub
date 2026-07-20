'use client';

import { useEffect, useState } from 'react';

export function useLiveTime(intervalMs = 1000) {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return time;
}
