"use client";

import { InvoiceForm } from "@/components/invoice/invoice-form";

export default function SalesReturnPage() {
  return <InvoiceForm type="sales" isReturn={true} />;
}