import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SupplyMindActions from "@/app/(dashboard)/supplymind/supplymind-actions";

const PLOT_HEIGHT = 230;

// Data simulasi bahan baku sebagai cadangan.
const DEMO_MATERIALS = [
  {
    label: "Baterai 1",
    value: 1700,
    safeStock: 1800,
    text: "text-[#3B82F6]",
    gradient: "from-[#3B82F6] to-[#BFDBFE]",
  },
  {
    label: "Baterai 2",
    value: 1800,
    safeStock: 1900,
    text: "text-[#8B5CF6]",
    gradient: "from-[#8B5CF6] to-[#DDD6FE]",
  },
  {
    label: "Baterai 3",
    value: 1900,
    safeStock: 1800,
    text: "text-[#F97316]",
    gradient: "from-[#F97316] to-[#FFCBA8]",
  },
  {
    label: "Baterai 4",
    value: 2800,
    safeStock: 2500,
    text: "text-[#FBBF24]",
    gradient: "from-[#FBBF24] to-[#FEF3C7]",
  },
];

const BAR_STYLES = [
  {
    text: "text-[#3B82F6]",
    gradient: "from-[#3B82F6] to-[#BFDBFE]",
  },
  {
    text: "text-[#8B5CF6]",
    gradient: "from-[#8B5CF6] to-[#DDD6FE]",
  },
  {
    text: "text-[#F97316]",
    gradient: "from-[#F97316] to-[#FFCBA8]",
  },
  {
    text: "text-[#FBBF24]",
    gradient: "from-[#FBBF24] to-[#FEF3C7]",
  },
];

export default async function SupplyMindPage() {
  const { data, error } = await supabase
    .from("raw_materials")
    .select(
      "id, name, sku, unit, current_stock, minimum_stock, unit_cost, supplier_name, updated_at"
    )
    .order("name");

  // Jika data berhasil diambil, gunakan data Supabase.
  // Jika tabel kosong atau query gagal, gunakan data simulasi.
  const usingDemoData = !!error || !data || data.length === 0;

  console.log("SupplyMind query result:", {
    error: error
      ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      : null,
    data,
    dataLength: data?.length,
  });

  const MATERIALS = usingDemoData
    ? DEMO_MATERIALS
    : data.map((item, index) => ({
        label: item.name,
        value: Number(item.current_stock) || 0,
        safeStock: Number(item.minimum_stock) || 0,
        ...BAR_STYLES[index % BAR_STYLES.length],
      }));

  // Skala dinamis: mengikuti nilai tertinggi, kelipatan rapi, minimal 3.000.
  const rawMax = Math.max(...MATERIALS.map((m) => m.value), 3000);
  const step = Math.ceil(rawMax / 6 / 500) * 500;
  const chartMax = step * 6;

  const yTicks = Array.from({ length: 7 }, (_, i) =>
    (step * (6 - i)).toLocaleString("id-ID")
  );

  // Analisis stok berdasarkan batas minimum.
  const criticalMaterials = MATERIALS.filter(
    (material) => material.value < material.safeStock
  );

  const totalStock = MATERIALS.reduce(
    (total, material) => total + material.value,
    0
  );

  const totalShortage = criticalMaterials.reduce(
    (total, material) => total + material.safeStock - material.value,
    0
  );

  const insightMessage =
    criticalMaterials.length > 0
      ? `⚠ Berdasarkan analisis stok, ${criticalMaterials
          .map((material) => material.label)
          .join(" dan ")} berada di bawah batas aman. Total kekurangan untuk mencapai batas minimum adalah ${totalShortage.toLocaleString(
          "id-ID"
        )} unit. Segera evaluasi pemesanan untuk menjaga kelancaran produksi.`
      : "✓ Seluruh bahan baku berada pada atau di atas batas aman. Pantau perubahan stok dan kebutuhan produksi secara berkala.";

  return (
    <div className="px-10 pb-10 pt-[30px]">
      <div className="flex items-center justify-between">
        <Breadcrumb current="SupplyMind" />
        <span className="text-[12px] text-[#94A3B8]">
          {usingDemoData
            ? "Terakhir diperbarui: Data simulasi"
            : `Terakhir diperbarui: ${new Date(
                Math.max(
                  ...data.map((item) =>
                    item.updated_at
                      ? new Date(item.updated_at).getTime()
                      : 0
                  )
                )
              ).toLocaleString("id-ID")}`}
        </span>
      </div>

      {/* Kartu grafik */}
      <section className="relative mt-3 h-[399px] rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        <h2 className="absolute left-7 top-7 text-[18px] font-bold leading-5 text-[#111827]">
          Kadar Stok Bahan Baku (PPIC)
        </h2>

        {/* Sumbu Y */}
        <div className="absolute left-7 top-[97px] flex h-[246px] flex-col justify-between text-[11px] leading-none text-[#9CA3AF]">
          {yTicks.map((tick) => (
            <span key={tick} className="-my-[5px]">
              {tick}
            </span>
          ))}
        </div>

        {/* Batang */}
        <div className="absolute left-[84px] right-[44px] top-[97px] flex">
          {MATERIALS.map((bar, index) => {
            const height = Math.min(
              PLOT_HEIGHT,
              Math.max(0, Math.round((bar.value / chartMax) * PLOT_HEIGHT))
            );

            return (
              <div
                key={`${bar.label}-${index}`}
                className="relative flex h-[230px] min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className={`mb-2 text-[13px] font-bold ${bar.text}`}>
                  {bar.value.toLocaleString("id-ID")}
                </span>
                <div
                  className={`w-[54px] max-w-full rounded-t-[10px] bg-gradient-to-b ${bar.gradient}`}
                  style={{ height }}
                />
                <span
                  title={bar.label}
                  className="absolute left-1/2 top-full mt-2 w-full -translate-x-1/2 truncate px-1 text-center text-[13px] text-[#374151]"
                >
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
            {insightMessage}
          </p>
        </div>
      </section>

      {/* Aksi */}
      <SupplyMindActions
        criticalMaterials={criticalMaterials}
        totalShortage={totalShortage}
      />
    </div>
  );
}