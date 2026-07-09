import type { Metadata } from "next";
import ReduceClient from "@/components/ReduceClient";

export const metadata: Metadata = {
  title: "Reduce IFC File Size — ifc2go.com",
  description:
    "One-click IFC optimizer with light, medium and aggressive cleanup — purge metadata, strip non-physical entities and simplify meshes.",
};

export default function ReducePage() {
  return <ReduceClient />;
}
