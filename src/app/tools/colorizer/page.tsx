import type { Metadata } from "next";
import RecolourerClient from "@/components/RecolourerClient";

export const metadata: Metadata = {
  title: "IFC Recolourer — ifc2go.com",
  description:
    "Auto-generate discipline colour profiles from IFC class or system data and export a colour-coded IFC file.",
};

export default function RecolourerPage() {
  return <RecolourerClient />;
}
