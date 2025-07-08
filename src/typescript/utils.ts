export function debounce(func: () => void, wait: number) {
  let timeout: number | null = null;
  return () => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      func();
    }, wait);
  };
}