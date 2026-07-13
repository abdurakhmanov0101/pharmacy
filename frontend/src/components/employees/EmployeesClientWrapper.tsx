'use client';

import dynamic from "next/dynamic";

const EmployeesClient = dynamic(() => import("@/components/employees/EmployeesClient"), {
  ssr: false,
});

export default function EmployeesClientWrapper() {
  return <EmployeesClient />;
}
