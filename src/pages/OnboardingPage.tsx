import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Step, Stepper } from "../components/ui/stepper";
import { Loader2 } from "lucide-react";
import { QRCodeSVG as QRCode } from "qrcode.react";
import axios from "axios";

const steps: Step[] = [
  { title: "Verify Personhood", description: "Prove you are human" },
  { title: "Student Access Card", description: "Get your student access card" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofId, setProofId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [credentialUrl, setCredentialUrl] = useState<string | null>(null);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  const verifyPersonhood = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/verification/verify-phc`
      );
      setProofUrl(response.data.data.proofUrl);
      setProofId(response.data.data.proofRecord.id);
      await checkVerificationState(response.data.data.proofRecord.id);
    } catch (err) {
      setError("Failed to initiate personhood verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationState = async (id: string) => {
    let state = "request-sent";
    while (state !== "done" && state !== "abandoned") {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/verification/verification-state/id/${id}`
        );
        state = response.data.data.state;
        if (state === "done") {
          setCurrentStep(1);
          break;
        } else if (state === "abandoned") {
          setError("Verification failed. Please try again.");
          break;
        }
      } catch (err) {
        setError("Failed to check verification state. Please try again.");
        break;
      }
    }
  };

  const issueStudentAccessCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${process.env.BASE_URL}/issuance/issue-student-access-card/name/${encodeURIComponent(
          name
        )}`
      );
      setCredentialUrl(response.data.data.credentialUrl);
      setCredentialId(response.data.data.credentialRecord.id);
      await checkCredentialState(response.data.data.credentialRecord.id);
    } catch (err) {
      setError("Failed to issue student access card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkCredentialState = async (id: string) => {
    let state = "offer-sent";
    while (state !== "done" && state !== "abandoned") {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
      try {
        const response = await axios.get(
          `${process.env.BASE_URL}/issuance/credential-state/id/${id}`
        );
        state = response.data.data.state;
        if (state === "done") {
          setCurrentStep(2); // Move to success state
          break;
        } else if (state === "abandoned") {
          setError("Failed to issue credential. Please try again.");
          break;
        }
      } catch (err) {
        setError("Failed to check credential state. Please try again.");
        break;
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Student Onboarding</h1>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Get Started with SSI</CardTitle>
        </CardHeader>
        <CardContent>
          <Stepper steps={steps} currentStep={currentStep} />

          {currentStep === 0 && (
            <div className="mt-6">
              <p className="mb-4">First, let's verify that you're human.</p>
              <Button onClick={verifyPersonhood} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Verify Personhood"
                )}
              </Button>
              {proofUrl && (
                <div className="mt-4">
                  <p className="mb-2">
                    Scan this QR code with your digital wallet:
                  </p>
                  <QRCode value={proofUrl} size={200} className="mx-auto" />
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="mt-6">
              <p className="mb-4">
                Great! Now let's issue your Student Access Card.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <Button
                  onClick={issueStudentAccessCard}
                  disabled={loading || !name}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Issue Student Access Card"
                  )}
                </Button>
              </div>
              {credentialUrl && (
                <div className="mt-4">
                  <p className="mb-2">
                    Scan this QR code to receive your Student Access Card:
                  </p>
                  <QRCode
                    value={credentialUrl}
                    size={200}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Onboarding Complete!
              </h2>
              <p>
                Congratulations! You've successfully completed the onboarding
                process and received your Student Access Card. Now you can
                browse through the SSI training modules.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
