import type { Metadata } from "next";
import ColorizerClient from "@/components/ColorizerClient";

export const metadata: Metadata = {
  title: "IFC Recolourer — ifctools.io",
  description:
    "Recolour IFC elements by type with discipline-standard colours and export the modified IFC. No install required.",
};

export default function ColorizerPage() {
  return <ColorizerClient />;
}
