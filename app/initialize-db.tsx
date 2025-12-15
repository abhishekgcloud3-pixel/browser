'use client';

import { useEffect } from 'react';
import { initializeDatabase } from '@/stores/db';

export function InitializeDB() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return null;
}
