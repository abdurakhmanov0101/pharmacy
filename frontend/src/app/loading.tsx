export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[50vh] space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Yuklanmoqda...</p>
    </div>
  );
}
