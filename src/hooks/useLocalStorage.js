import { useState, useEffect } from 'react';

/**
 * Hook reutilizable para sincronizar un estado de React con window.localStorage
 * de forma segura ante errores de parseo o restricciones de almacenamiento.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn(`No se pudo leer "${key}" de localStorage:`, error);
    }

    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`No se pudo guardar "${key}" en localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
