import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      {/* Panel kanan: isinya berganti sesuai menu yang dipilih di sidebar */}
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}