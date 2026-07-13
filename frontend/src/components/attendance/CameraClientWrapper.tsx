'use client';

import dynamic from "next/dynamic";

const CameraClient = dynamic(() => import("@/components/attendance/CameraClient"), {
  ssr: false,
});

export default function CameraClientWrapper() {
  return <CameraClient />;
}
