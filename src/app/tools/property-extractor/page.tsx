import type { Metadata } from "next";
import PropertyExtractorClient from "@/components/PropertyExtractorClient";

export const metadata: Metadata = {
  title: "Property Extractor — ifc2go.com",
  description:
    "Export all IFC element properties and quantities to CSV in one click. Opens in Excel.",
};

export default function PropertyExtractorPage() {
  return <PropertyExtractorClient />;
}
