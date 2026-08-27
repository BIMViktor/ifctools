import type { Metadata } from "next";
import KeepPhysicalClient from "@/components/KeepPhysicalClient";

export const metadata: Metadata = {
  title: "Keep Only Physical Elements — ifc2go.com",
  description:
    "Strip spaces, zones, 2D annotations and grids from an IFC model, leaving only physical geometry.",
};

export default function KeepPhysicalPage() {
  return <KeepPhysicalClient />;
}
