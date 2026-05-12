"use client";

import { InvoiceForm } from "@/components/invoice/invoice-form";

export default function PurchaseReturnPage() {
  return <InvoiceForm type="purchase" isReturn={true} />;
}