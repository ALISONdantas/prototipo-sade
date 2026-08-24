import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastVariant } from '../components/Toast';

const DEFAULT_DURATION_MS = 2500;

export function useToast() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), DEFAULT_DURATION_MS);
  }, []);

  return { toast, showToast };
}
