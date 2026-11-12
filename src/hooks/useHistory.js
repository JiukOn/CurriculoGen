import { useState, useCallback, useEffect } from 'react';

/**
 * Hook atômico para gerenciamento de histórico com Undo / Redo e suporte a functional updaters
 */
export const useHistory = (initialPresent, maxHistory = 40) => {
  const [history, setHistory] = useState(() => ({
    past: [],
    present: initialPresent,
    future: []
  }));

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const set = useCallback((valueOrUpdater) => {
    setHistory(prev => {
      const nextPresent = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev.present)
        : valueOrUpdater;

      if (Object.is(nextPresent, prev.present)) return prev;
      try {
        if (JSON.stringify(nextPresent) === JSON.stringify(prev.present)) {
          return prev;
        }
      } catch {}

      const updatedPast = [...prev.past, prev.present];
      const trimmedPast = updatedPast.length > maxHistory
        ? updatedPast.slice(updatedPast.length - maxHistory)
        : updatedPast;

      return {
        past: trimmedPast,
        present: nextPresent,
        future: []
      };
    });
  }, [maxHistory]);

  // Suporte aos atalhos universais de teclado Ctrl+Z e Ctrl+Y / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (isCtrlOrCmd && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount: history.past.length,
    redoCount: history.future.length
  };
};
