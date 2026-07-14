import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function Dashboard() {
  let stats = null;
  let error = null;

  try {
    const res = await fetch('http://localhost:3001/api/dashboard', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    stats = await res.json();
  } catch (err) {
    error = "Could not connect to the backend server.";
  }

  return <DashboardClient stats={stats} error={error} />;
}
