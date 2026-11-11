export default function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] leading-5">
      <span className="text-[#94A3B8]">Dashboard</span>
      <span className="text-[#CBD5E1]">/</span>
      <span className="font-medium text-[#1E293B]">{current}</span>
    </div>
  );
}