import { InventoryClient } from "@/components/inventory/InventoryClient";

export const metadata = {
  title: "Ombor | AptekaOS",
  description: "Ombor qoldiqlari va filiallarni boshqarish",
};

export default function InventoryPage() {
  return <InventoryClient />;
}
