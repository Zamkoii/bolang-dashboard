"use client";

import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Sale = {
  productName: string;
  total: number;
  time: string;
  customer: string;
};

const FALLBACK: Sale = {
  productName: "Baterai ABC AA 1.5V",
  total: 96000,
  time: "09:42",
  customer: "Rina Kartika · Sinar Jaya",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function RecentSaleCard() {
  const [sale, setSale] = useState<Sale>(FALLBACK);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.rpc("get_latest_sale");

      if (error || !data || data.length === 0 || !alive) return;

      const latest = data[0];
      const orderDate = new Date(latest.created_at);
      const timeStr = orderDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setSale({
        productName: latest.product_name,
        total: latest.total,
        time: timeStr,
        customer: latest.customer_name,
      });
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-white/10 bg-[#16233D] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.08em] text-[#8FA3BF]">
          <span className="size-1.5 rounded-full bg-[#34D399]" />
          TERJUAL BARU
        </span>
        <span className="text-[9px] text-[#64748B]">{sale.time}</span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-[#FBBF24]">
          <ReceiptText className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11.5px] font-semibold text-white">
            {sale.productName}
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-white">
            <span className="mr-0.5 text-[10px] font-medium text-white/70">Rp</span>
            {sale.total.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-white/10 text-[7px] font-bold text-white/70">
          {getInitials(sale.customer)}
        </span>
        <p className="truncate text-[9.5px] text-[#8FA3BF]">{sale.customer}</p>
      </div>
    </div>
  );
}