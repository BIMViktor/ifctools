import type { Metadata } from "next";
import CompareClient from "@/components/CompareClient";

export const metadata: Metadata = {
  title: "Compare IFC Files — ifc2go.com",
  description:
    "Visually diff two IFC models by GlobalId. Instantly see what was Added, Deleted, or Unchanged between versions.",
};

export default function ComparePage() {
  return <CompareClient />;
}
