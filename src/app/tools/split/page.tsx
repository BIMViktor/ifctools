import type { Metadata } from "next";
import SplitClient from "@/components/SplitClient";

export const metadata: Metadata = {
  title: "Split IFC — ifc2go.com",
  description:
    "Divide an IFC model by storey, building, class or property and download isolated IFC files.",
};

export default function SplitPage() {
  return <SplitClient />;
}
