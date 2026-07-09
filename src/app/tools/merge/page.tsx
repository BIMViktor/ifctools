import type { Metadata } from "next";
import MergeClient from "@/components/MergeClient";

export const metadata: Metadata = {
  title: "Merge IFC — ifc2go.com",
  description:
    "Combine separate discipline IFC models into one federated file. Arch, Structure and MEP — merged in your browser.",
};

export default function MergePage() {
  return <MergeClient />;
}
