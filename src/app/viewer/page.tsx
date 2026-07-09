import type { Metadata } from "next";
import ViewerClient from "@/components/ViewerClient";

export const metadata: Metadata = {
  title: "IFC Viewer — ifc2go.com",
  description:
    "Drop an IFC file and explore it in 3D with WebGPU rendering, project tree, properties panel, and full camera controls. No install required.",
};

export default function ViewerPage() {
  return <ViewerClient />;
}
