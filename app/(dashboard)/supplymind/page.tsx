import { Phone, ShoppingCart, Sparkles } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

const Y_AXIS = ["3.000", "2.500", "2.000", "1.500", "1.000", "500", "0"];
const MAX = 3000;
const PLOT_HEIGHT = 230; // px untuk nilai MAX

const BARS = [
  { label: "Baterai 1", value: 1700, text: "text-[#3B82F6]", gradient: "from-[#3B82F6] to-[#BFDBFE]" },
  { label: "Baterai 2", value: 1800, text: "text-[#8B5CF6]", gradient: "from-[#8B5CF6] to-[#DDD6FE]" },
  { label: "Baterai 3", value: 1900, text: "text-[#F97316]", gradient: "from-[#F97316] to-[#FFCBA8]" },
  { label: "Baterai 4", value: 2800, text: "text-[#FBBF24]", gradient: "from-[#FBBF24] to-[#FEF3C7]" },
];

export default function SupplyMindPage() {
  return (
    <div className="px-10 pb-10 pt-[30px]">
      <div className="flex items-center justify-between">
        <Breadcrumb current="SupplyMind" />
        <span className="text-[12px] text-[#94A3B8]">
          Terakhir diperbarui: 5 menit lalu
        </span>
      </div>

      {/* Kartu grafik */}
      <section className="relative mt-3 h-[399px] rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <h2 className="absolute left-7 top-7 text-[18px] font-bold leading-5 text-[#111827]">
          Kadar Stok Bahan Baku (PPIC)
        </h2>

        {/* Sumbu Y */}
        <div className="absolute left-7 top-[97px] flex h-[246px] flex-col justify-between text-[11px] leading-none text-[#9CA3AF]">
          {Y_AXIS.map((tick) => (
            <span key={tick} className="-my-[5px]">
              {tick}
            </span>
          ))}
        </div>

        {/* Batang */}
        <div className="absolute left-[84px] right-[44px] top-[97px] flex">
          {BARS.map((bar) => {
            const height = Math.round((bar.value / MAX) * PLOT_HEIGHT);
            return (
              <div
                key={bar.label}
                className="relative flex h-[230px] flex-1 flex-col items-center justify-end"
              >
                <span className={`mb-2 text-[13px] font-bold ${bar.text}`}>
                  {bar.value}
                </span>
                <div
                  className={`w-[54px] rounded-t-[10px] bg-gradient-to-b ${bar.gradient}`}
                  style={{ height }}
                />
                <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap text-[13px] text-[#374151]">
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Insights */}
      <section className="mt-6 flex items-start gap-4 rounded-xl border border-[#FED7AA] bg-[#FFFBF6] p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF1E3] text-[#F97316]">
          <Sparkles className="size-[22px]" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-[15px] font-bold text-[#111827]">
            AI Insights - Rekomendasi MRP
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-[22px] text-[#4B5563]">
            <span aria-hidden>⚠</span> Berdasarkan analisis, stok Baterai 1 dan
            Baterai 2 hampir habis dan berada di bawah batas aman. Harap segera
            lakukan pemesanan (kebutuhan 1.500 unit) untuk jadwal produksi
            minggu depan.
          </p>
        </div>
      </section>

      {/* Aksi */}
      <div className="mt-6 flex flex-col items-start gap-3">
        <button className="flex h-9 items-center gap-2 rounded-lg bg-[#F97316] px-[18px] text-[13px] font-semibold text-white transition hover:bg-[#EA6A0B]">
          <ShoppingCart className="size-4" strokeWidth={2} />
          Buat PO Otomatis
        </button>
        <button className="ml-3.5 flex items-center gap-1.5 text-[13px] font-medium text-[#F97316] transition hover:text-[#EA6A0B]">
          <Phone className="size-[14px]" strokeWidth={2} />
          Hubungi Vendor
        </button>
      </div>
    </div>
  );
}