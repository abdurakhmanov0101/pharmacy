// This is a server-side page, we use native fetch here (no JWT needed for public endpoints)
// Client-side components use the fetcher utility from @/utils/fetcher
const nativeFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};
