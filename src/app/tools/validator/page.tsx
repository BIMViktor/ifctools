import type { Metadata } from "next";
import IdsValidatorClient from "@/components/IdsValidatorClient";

export const metadata: Metadata = {
  title: "IDS Validator — ifc2go.com",
  description:
    "Validate IFC models against buildingSMART IDS specifications. Export failures as BCF 2.1 for coordination tools.",
};

export default function IdsValidatorPage() {
  return <IdsValidatorClient />;
}
